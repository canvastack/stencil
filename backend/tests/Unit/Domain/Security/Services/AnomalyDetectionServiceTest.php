<?php

namespace Tests\Unit\Domain\Security\Services;

use Tests\TestCase;
use App\Domain\Security\Services\AnomalyDetectionService;
use App\Domain\Security\ValueObjects\SecurityAnalysis;
use App\Domain\Security\ValueObjects\LoginPattern;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class AnomalyDetectionServiceTest extends TestCase
{
    use RefreshDatabase;

    private AnomalyDetectionService $anomalyDetectionService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->anomalyDetectionService = new AnomalyDetectionService();
    }

    public function test_it_analyzes_login_patterns_successfully()
    {
        // Arrange
        $user = User::factory()->create();
        $loginData = [
            [
                'user_id' => $user->id,
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'login_time' => Carbon::now()->subHours(1),
                'success' => true
            ],
            [
                'user_id' => $user->id,
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'login_time' => Carbon::now()->subHours(2),
                'success' => true
            ]
        ];

        // Act
        $analysis = $this->anomalyDetectionService->analyzeLoginPatterns($user->id, $loginData);

        // Assert
        $this->assertInstanceOf(SecurityAnalysis::class, $analysis);
        $this->assertIsFloat($analysis->getRiskScore());
        $this->assertIsArray($analysis->getAnomalies());
        $this->assertIsArray($analysis->getRecommendations());
    }

    public function test_it_detects_suspicious_ip_addresses()
    {
        // Arrange
        $user = User::factory()->create();
        $loginData = [
            [
                'user_id' => $user->id,
                'ip_address' => '192.168.1.1', // Normal IP
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'login_time' => Carbon::now()->subDays(1),
                'success' => true
            ],
            [
                'user_id' => $user->id,
                'ip_address' => '10.0.0.1', // Different IP - suspicious
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'login_time' => Carbon::now(),
                'success' => true
            ]
        ];

        // Act
        $analysis = $this->anomalyDetectionService->analyzeLoginPatterns($user->id, $loginData);

        // Assert
        $this->assertGreaterThanOrEqual(0.3, $analysis->getRiskScore());
        $anomalies = $analysis->getAnomalies();
        $this->assertTrue(
            collect($anomalies)->contains(fn($anomaly) => 
                str_contains($anomaly->getType(), 'ip') || str_contains($anomaly->getDescription(), 'IP')
            )
        );
    }

    public function test_it_detects_unusual_login_times()
    {
        // Arrange
        $user = User::factory()->create();
        $loginData = [
            [
                'user_id' => $user->id,
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'login_time' => Carbon::now()->setTime(9, 0), // Normal business hours
                'success' => true
            ],
            [
                'user_id' => $user->id,
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'login_time' => Carbon::now()->setTime(3, 0), // Unusual time (3 AM)
                'success' => true
            ]
        ];

        // Act
        $analysis = $this->anomalyDetectionService->analyzeLoginPatterns($user->id, $loginData);

        // Assert
        $this->assertGreaterThanOrEqual(0.2, $analysis->getRiskScore());
        $anomalies = $analysis->getAnomalies();
        $this->assertTrue(
            collect($anomalies)->contains(fn($anomaly) => 
                str_contains($anomaly->getType(), 'time') || str_contains($anomaly->getDescription(), 'time')
            )
        );
    }

    public function test_it_detects_multiple_failed_login_attempts()
    {
        // Arrange
        $user = User::factory()->create();
        $loginData = [
            [
                'user_id' => $user->id,
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'login_time' => Carbon::now()->subMinutes(5),
                'success' => false
            ],
            [
                'user_id' => $user->id,
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'login_time' => Carbon::now()->subMinutes(3),
                'success' => false
            ],
            [
                'user_id' => $user->id,
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'login_time' => Carbon::now()->subMinutes(1),
                'success' => false
            ]
        ];

        // Act
        $analysis = $this->anomalyDetectionService->analyzeLoginPatterns($user->id, $loginData);

        // Assert
        $this->assertGreaterThanOrEqual(0.5, $analysis->getRiskScore());
        $anomalies = $analysis->getAnomalies();
        $this->assertTrue(
            collect($anomalies)->contains(fn($anomaly) => 
                str_contains($anomaly->getType(), 'failed') || str_contains($anomaly->getDescription(), 'failed')
            )
        );
    }

    public function test_it_detects_user_agent_anomalies()
    {
        // Arrange
        $user = User::factory()->create();
        $loginData = [
            [
                'user_id' => $user->id,
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'login_time' => Carbon::now()->subDays(1),
                'success' => true
            ],
            [
                'user_id' => $user->id,
                'ip_address' => '192.168.1.1',
                'user_agent' => 'curl/7.68.0', // Suspicious user agent
                'login_time' => Carbon::now(),
                'success' => true
            ]
        ];

        // Act
        $analysis = $this->anomalyDetectionService->analyzeLoginPatterns($user->id, $loginData);

        // Assert
        $this->assertGreaterThanOrEqual(0.4, $analysis->getRiskScore());
        $anomalies = $analysis->getAnomalies();
        $this->assertTrue(
            collect($anomalies)->contains(fn($anomaly) => 
                str_contains($anomaly->getType(), 'user_agent') || str_contains($anomaly->getDescription(), 'user agent')
            )
        );
    }

    public function test_it_analyzes_system_behavior()
    {
        // Arrange
        $systemMetrics = [
            'cpu_usage' => 85.5,
            'memory_usage' => 78.2,
            'disk_usage' => 65.0,
            'network_traffic' => 1024000,
            'active_sessions' => 150,
            'failed_requests' => 25,
            'response_time' => 250
        ];

        // Act
        $analysis = $this->anomalyDetectionService->analyzeSystemBehavior($systemMetrics);

        // Assert
        $this->assertInstanceOf(SecurityAnalysis::class, $analysis);
        $this->assertIsFloat($analysis->getRiskScore());
        $this->assertIsArray($analysis->getAnomalies());
        $this->assertIsArray($analysis->getRecommendations());
    }

    public function test_it_detects_high_cpu_usage_anomaly()
    {
        // Arrange
        $systemMetrics = [
            'cpu_usage' => 95.0, // Very high CPU usage
            'memory_usage' => 50.0,
            'disk_usage' => 40.0,
            'network_traffic' => 500000,
            'active_sessions' => 50,
            'failed_requests' => 5,
            'response_time' => 150
        ];

        // Act
        $analysis = $this->anomalyDetectionService->analyzeSystemBehavior($systemMetrics);

        // Assert
        $this->assertGreaterThanOrEqual(0.3, $analysis->getRiskScore());
        $anomalies = $analysis->getAnomalies();
        $this->assertTrue(
            collect($anomalies)->contains(fn($anomaly) => 
                str_contains($anomaly->getType(), 'cpu') || str_contains($anomaly->getDescription(), 'CPU')
            )
        );
    }

    public function test_it_detects_high_failed_requests_anomaly()
    {
        // Arrange
        $systemMetrics = [
            'cpu_usage' => 45.0,
            'memory_usage' => 50.0,
            'disk_usage' => 40.0,
            'network_traffic' => 500000,
            'active_sessions' => 50,
            'failed_requests' => 150, // Very high failed requests
            'response_time' => 150
        ];

        // Act
        $analysis = $this->anomalyDetectionService->analyzeSystemBehavior($systemMetrics);

        // Assert
        $this->assertGreaterThanOrEqual(0.4, $analysis->getRiskScore());
        $anomalies = $analysis->getAnomalies();
        $this->assertTrue(
            collect($anomalies)->contains(fn($anomaly) => 
                str_contains($anomaly->getType(), 'requests') || str_contains($anomaly->getDescription(), 'requests')
            )
        );
    }

    public function test_it_generates_security_recommendations()
    {
        // Arrange
        $user = User::factory()->create();
        $highRiskLoginData = [
            [
                'user_id' => $user->id,
                'ip_address' => '192.168.1.1',
                'user_agent' => 'curl/7.68.0',
                'login_time' => Carbon::now()->setTime(3, 0),
                'success' => false
            ]
        ];

        // Act
        $analysis = $this->anomalyDetectionService->analyzeLoginPatterns($user->id, $highRiskLoginData);

        // Assert
        $recommendations = $analysis->getRecommendations();
        $this->assertNotEmpty($recommendations);
        $this->assertTrue(is_array($recommendations));
        
        // Should contain actionable recommendations
        $this->assertTrue(
            collect($recommendations)->contains(fn($rec) => 
                str_contains($rec->getTitle(), 'Risk') || 
                str_contains($rec->getDescription(), 'security') || 
                count($rec->getActions()) > 0
            )
        );
    }

    public function test_it_calculates_risk_score_correctly()
    {
        // Arrange
        $user = User::factory()->create();
        
        // Low risk scenario
        $lowRiskData = [
            [
                'user_id' => $user->id,
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'login_time' => Carbon::now()->setTime(10, 0),
                'success' => true
            ]
        ];

        // High risk scenario
        $highRiskData = [
            [
                'user_id' => $user->id,
                'ip_address' => '10.0.0.1',
                'user_agent' => 'curl/7.68.0',
                'login_time' => Carbon::now()->setTime(3, 0),
                'success' => false
            ]
        ];

        // Act
        $lowRiskAnalysis = $this->anomalyDetectionService->analyzeLoginPatterns($user->id, $lowRiskData);
        $highRiskAnalysis = $this->anomalyDetectionService->analyzeLoginPatterns($user->id, $highRiskData);

        // Assert
        $this->assertLessThan($highRiskAnalysis->getRiskScore(), $lowRiskAnalysis->getRiskScore());
        $this->assertGreaterThanOrEqual(0.0, $lowRiskAnalysis->getRiskScore());
        $this->assertLessThanOrEqual(1.0, $highRiskAnalysis->getRiskScore());
    }

    public function test_it_handles_empty_login_data()
    {
        // Arrange
        $user = User::factory()->create();
        $emptyLoginData = [];

        // Act
        $analysis = $this->anomalyDetectionService->analyzeLoginPatterns($user->id, $emptyLoginData);

        // Assert
        $this->assertInstanceOf(SecurityAnalysis::class, $analysis);
        $this->assertEquals(0.0, $analysis->getRiskScore());
        $this->assertEmpty($analysis->getAnomalies());
    }
}