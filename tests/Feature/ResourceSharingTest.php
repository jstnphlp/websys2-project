<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Resource;
use App\Models\ResourceLoan;

class ResourceSharingTest extends TestCase
{
    use RefreshDatabase;

    private $admin;
    private $staff;
    private $member;
    private $tool;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->staff = User::factory()->create(['role' => 'staff']);
        $this->member = User::factory()->create(['role' => 'member']);
        
        $this->tool = Resource::create([
            'name' => 'Tiller',
            'category' => 'Power Equipment',
            'asset_tag' => 'TL-001',
            'condition' => 'good',
            'total_quantity' => 2,
            'available_quantity' => 2,
            'max_borrow_days' => 3,
            'status' => 'available',
            'created_by' => $this->staff->id,
        ]);
    }

    public function test_admin_can_access_resource_analytics_endpoint()
    {
        $response = $this->actingAs($this->admin)->getJson('/api/admin/resources/analytics');
        $response->assertStatus(200)
                 ->assertJsonStructure(['total_tools', 'active_loans_count', 'utilization_rate_pct']);
    }

    public function test_staff_and_members_cannot_access_admin_resource_analytics()
    {
        $this->actingAs($this->staff)->getJson('/api/admin/resources/analytics')->assertStatus(403);
        $this->actingAs($this->member)->getJson('/api/admin/resources/analytics')->assertStatus(403);
    }

    public function test_member_can_view_available_tools_catalog()
    {
        $retiredTool = Resource::create([
            'name' => 'Old Shovel',
            'category' => 'Hand Tools',
            'status' => 'retired',
            'created_by' => $this->staff->id,
        ]);

        $response = $this->actingAs($this->member)->getJson('/api/resources');
        
        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Tiller', $data[0]['name']);
    }

    public function test_member_can_request_tool_loan_within_limits()
    {
        $response = $this->actingAs($this->member)->postJson('/api/resource-loans', [
            'resource_id' => $this->tool->id,
            'quantity' => 1,
            'borrow_start' => now()->addDay()->toDateString(),
            'borrow_end' => now()->addDays(2)->toDateString(),
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('resource_loans', [
            'resource_id' => $this->tool->id,
            'borrower_id' => $this->member->id,
            'status' => 'requested'
        ]);
    }

    public function test_loan_request_exceeding_max_days_is_rejected()
    {
        $response = $this->actingAs($this->member)->postJson('/api/resource-loans', [
            'resource_id' => $this->tool->id,
            'quantity' => 1,
            'borrow_start' => now()->addDay()->toDateString(),
            'borrow_end' => now()->addDays(5)->toDateString(), // 4 days, max is 3
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('borrow_end');
    }

    public function test_members_cannot_approve_or_checkout_loans()
    {
        $loan = ResourceLoan::create([
            'resource_id' => $this->tool->id,
            'borrower_id' => $this->member->id,
            'quantity' => 1,
            'status' => 'requested',
            'borrow_start' => now()->addDay(),
            'borrow_end' => now()->addDays(2),
        ]);

        $this->actingAs($this->member)->postJson("/api/resource-loans/{$loan->id}/approve")->assertStatus(403);
        $this->actingAs($this->member)->postJson("/api/resource-loans/{$loan->id}/checkout")->assertStatus(403);
    }

    public function test_staff_can_approve_and_checkout_tool()
    {
        $loan = ResourceLoan::create([
            'resource_id' => $this->tool->id,
            'borrower_id' => $this->member->id,
            'quantity' => 1,
            'status' => 'requested',
            'borrow_start' => now()->addDay(),
            'borrow_end' => now()->addDays(2),
        ]);

        $this->actingAs($this->staff)->postJson("/api/resource-loans/{$loan->id}/approve")
             ->assertStatus(200);
             
        $this->assertEquals('approved', $loan->fresh()->status);

        $this->actingAs($this->staff)->postJson("/api/resource-loans/{$loan->id}/checkout")
             ->assertStatus(200);

        $this->assertEquals('active', $loan->fresh()->status);
        $this->assertEquals(1, $this->tool->fresh()->available_quantity);
    }

    public function test_staff_checkin_restores_inventory_and_logs_condition()
    {
        $loan = ResourceLoan::create([
            'resource_id' => $this->tool->id,
            'borrower_id' => $this->member->id,
            'quantity' => 1,
            'status' => 'active',
            'borrow_start' => now()->addDay(),
            'borrow_end' => now()->addDays(2),
        ]);
        
        $this->tool->update(['available_quantity' => 1]);

        $this->actingAs($this->staff)->postJson("/api/resource-loans/{$loan->id}/return", [
            'return_condition' => 'good'
        ])->assertStatus(200);

        $this->assertEquals('returned', $loan->fresh()->status);
        $this->assertEquals('good', $loan->fresh()->return_condition);
        $this->assertEquals(2, $this->tool->fresh()->available_quantity);
    }

    public function test_damaged_return_transitions_resource_to_maintenance()
    {
        $loan = ResourceLoan::create([
            'resource_id' => $this->tool->id,
            'borrower_id' => $this->member->id,
            'quantity' => 1,
            'status' => 'active',
            'borrow_start' => now()->addDay(),
            'borrow_end' => now()->addDays(2),
        ]);

        $this->actingAs($this->staff)->postJson("/api/resource-loans/{$loan->id}/return", [
            'return_condition' => 'needs_repair'
        ])->assertStatus(200);

        $this->assertEquals('maintenance', $this->tool->fresh()->status);
        $this->assertEquals('needs_repair', $this->tool->fresh()->condition);
    }

    public function test_member_sees_only_own_loans()
    {
        $member2 = User::factory()->create(['role' => 'member']);
        
        ResourceLoan::create([
            'resource_id' => $this->tool->id,
            'borrower_id' => $this->member->id,
            'quantity' => 1,
            'status' => 'active',
            'borrow_start' => now()->addDay(),
            'borrow_end' => now()->addDays(2),
        ]);
        
        ResourceLoan::create([
            'resource_id' => $this->tool->id,
            'borrower_id' => $member2->id,
            'quantity' => 1,
            'status' => 'active',
            'borrow_start' => now()->addDay(),
            'borrow_end' => now()->addDays(2),
        ]);

        $response = $this->actingAs($this->member)->getJson('/api/my-loans');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($this->member->id, $response->json('data')[0]['borrower_id']);
    }
}
