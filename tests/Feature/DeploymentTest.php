<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeploymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_trusted_hosting_proxy_preserves_https_redirects(): void
    {
        config(['trustedproxy.proxies' => '*']);

        $this->withServerVariables([
            'REMOTE_ADDR' => '10.0.0.10',
            'HTTP_HOST' => 'garden.example',
            'HTTP_X_FORWARDED_PROTO' => 'https',
            'HTTP_X_FORWARDED_PORT' => '443',
        ])->get('http://garden.example/')->assertRedirect('https://garden.example/login');
    }

    public function test_forwarded_protocol_is_ignored_without_a_trusted_proxy(): void
    {
        config(['trustedproxy.proxies' => null]);

        $this->withServerVariables([
            'REMOTE_ADDR' => '10.0.0.10',
            'HTTP_HOST' => 'garden.example',
            'HTTP_X_FORWARDED_PROTO' => 'https',
            'HTTP_X_FORWARDED_PORT' => '443',
        ])->get('http://garden.example/')->assertRedirect('http://garden.example/login');
    }
}
