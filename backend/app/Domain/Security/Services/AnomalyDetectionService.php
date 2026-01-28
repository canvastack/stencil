<?php

namespace App\Domain\Security\Services;

use App\Domain\Security\ValueObjects\SecurityAnalysis;
use App\Domain\Security\ValueObjects\SecurityAnomaly;
use App\Domain\Security\ValueObjects\SecurityRecommendation;
use App\Domain\Security\ValueObjects\LoginPattern;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

/**
 * Anomaly Detection Service
 * 
 * Detects unusual user behavior patterns and potential security threats
 * by analyzing login patterns, geographic locations, and user activities.
 */
class AnomalyDetectionService
{
    private const ANALYSIS_PERIOD_DAYS = 30;
    private const MIN_LOGIN_HISTORY = 5;
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Detect anomalous activity for a user
     */
    public function detectAnomalousActivity(User $user): SecurityAnalysis
    {
        $cacheKey = "security_analysis_{$user->uuid}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user) {
            // Get recent activity from users.last_login_at and activity logs
            $recentActivity = $this->getUserRecentActivity($user, self::ANALYSIS_PERIOD_DAYS);
            $loginPatterns = $this->analyzeLoginPatterns($user, $recentActivity);
            
            $anomalies = [];
            
            // Check for unusual login times
            $timeAnomalies = $this->detectUnusualLoginTimes($loginPatterns);
            $anomalies = array_merge($anomalies, $timeAnomalies);
            
            // Check for unusual locations
            $locationAnomalies = $this->detectUnusualLocations($user, $recentActivity);
            $anomalies = array_merge($anomalies, $locationAnomalies);
            
            // Check for unusual device patterns
            $deviceAnomalies = $this->detectUnusualDevices($user, $recentActivity);
            $anomalies = array_merge($anomalies, $deviceAnomalies);
            
            // Check for suspicious activity patterns
            $activityAnomalies = $this->detectSuspiciousActivityPatterns($user, $recentActivity);
            $anomalies = array_merge($anomalies, $activityAnomalies);
            
            // Check for brute force attempts
            $bruteForceAnomalies = $this->detectBruteForceAttempts($user);
            $anomalies = array_merge($anomalies, $bruteForceAnomalies);
            
            $riskScore = $this->calculateRiskScore($anomalies);
            $recommendations = $this->generateSecurityRecommendations($anomalies, $riskScore);
            
            return new SecurityAnalysis(
                userId: $user->uuid,
                anomalies: $anomalies,
                riskScore: $riskScore,
                recommendations: $recommendations,
                analysisDate: now(),
                analysisPeriod: self::ANALYSIS_PERIOD_DAYS
            );
        });
    }

    /**
     * Get user's recent activity
     */
    private function getUserRecentActivity(User $user, int $days): array
    {
        $startDate = Carbon::now()->subDays($days);
        
        // Get activity logs
        $activityLogs = ActivityLog::where('causer_id', $user->id)
            ->where('created_at', '>=', $startDate)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'type' => 'activity',
                    'action' => $log->description,
                    'timestamp' => $log->created_at,
                    'ip_address' => $log->properties['ip_address'] ?? null,
                    'user_agent' => $log->properties['user_agent'] ?? null,
                    'location' => $log->properties['location'] ?? null,
                    'properties' => $log->properties
                ];
            })
            ->toArray();
        
        // Get login attempts from user metadata
        $metadata = $user->metadata ?? [];
        $loginHistory = $metadata['login_history'] ?? [];
        
        $loginLogs = collect($loginHistory)
            ->filter(function ($login) use ($startDate) {
                return Carbon::parse($login['timestamp'])->gte($startDate);
            })
            ->map(function ($login) {
                return [
                    'type' => 'login',
                    'action' => $login['success'] ? 'login_success' : 'login_failed',
                    'timestamp' => Carbon::parse($login['timestamp']),
                    'ip_address' => $login['ip_address'] ?? null,
                    'user_agent' => $login['user_agent'] ?? null,
                    'location' => $login['location'] ?? null,
                    'properties' => $login
                ];
            })
            ->toArray();
        
        return array_merge($activityLogs, $loginLogs);
    }

    /**
     * Analyze login patterns for anomaly detection
     */
    public function analyzeLoginPatterns(int $userId, array $loginData): SecurityAnalysis
    {
        $anomalies = [];
        $riskScore = 0.0;
        
        if (empty($loginData)) {
            return new SecurityAnalysis(
                userId: (string) $userId,
                anomalies: $anomalies,
                riskScore: $riskScore,
                recommendations: [],
                analysisDate: now(),
                analysisPeriod: 30
            );
        }
        
        // Analyze IP address patterns
        $ipAddresses = array_column($loginData, 'ip_address');
        $uniqueIps = array_unique($ipAddresses);
        if (count($uniqueIps) > 1) {
            $anomalies[] = new SecurityAnomaly(
                type: 'suspicious_ip',
                severity: 'medium',
                description: 'Multiple IP addresses detected',
                timestamp: now(),
                metadata: ['ip_addresses' => $uniqueIps]
            );
            $riskScore += 0.3;
        }
        
        // Analyze login times
        foreach ($loginData as $login) {
            $hour = Carbon::parse($login['login_time'])->hour;
            if ($hour < 6 || $hour > 22) { // Outside normal hours
                $anomalies[] = new SecurityAnomaly(
                    type: 'unusual_time',
                    severity: 'low',
                    description: 'Login at unusual time',
                    timestamp: Carbon::parse($login['login_time']),
                    metadata: ['hour' => $hour, 'time' => $login['login_time']]
                );
                $riskScore += 0.2;
            }
        }
        
        // Analyze failed login attempts
        $failedLogins = array_filter($loginData, fn($login) => !$login['success']);
        if (count($failedLogins) >= 3) {
            $anomalies[] = new SecurityAnomaly(
                type: 'multiple_failed_logins',
                severity: 'high',
                description: 'Multiple failed login attempts detected',
                timestamp: now(),
                metadata: ['failed_count' => count($failedLogins)]
            );
            $riskScore += 0.5;
        }
        
        // Analyze user agents
        $userAgents = array_column($loginData, 'user_agent');
        foreach ($userAgents as $userAgent) {
            if (strpos($userAgent, 'curl') !== false || strpos($userAgent, 'bot') !== false) {
                $anomalies[] = new SecurityAnomaly(
                    type: 'suspicious_user_agent',
                    severity: 'medium',
                    description: 'Suspicious user agent detected',
                    timestamp: now(),
                    metadata: ['user_agent' => $userAgent]
                );
                $riskScore += 0.4;
            }
        }
        
        $riskScore = min(1.0, $riskScore); // Cap at 1.0
        
        $recommendations = $this->generateSecurityRecommendations($anomalies, $riskScore);
        
        return new SecurityAnalysis(
            userId: (string) $userId,
            anomalies: $anomalies,
            riskScore: $riskScore,
            recommendations: $recommendations,
            analysisDate: now(),
            analysisPeriod: 30
        );
    }

    /**
     * Analyze system behavior for anomalies
     */
    public function analyzeSystemBehavior(array $systemMetrics): SecurityAnalysis
    {
        $anomalies = [];
        $riskScore = 0.0;
        
        // Analyze CPU usage
        if (isset($systemMetrics['cpu_usage']) && $systemMetrics['cpu_usage'] > 90) {
            $anomalies[] = new SecurityAnomaly(
                type: 'high_cpu_usage',
                severity: 'medium',
                description: 'Unusually high CPU usage detected',
                timestamp: now(),
                metadata: ['cpu_usage' => $systemMetrics['cpu_usage']]
            );
            $riskScore += 0.3;
        }
        
        // Analyze memory usage
        if (isset($systemMetrics['memory_usage']) && $systemMetrics['memory_usage'] > 85) {
            $anomalies[] = new SecurityAnomaly(
                type: 'high_memory_usage',
                severity: 'medium',
                description: 'High memory usage detected',
                timestamp: now(),
                metadata: ['memory_usage' => $systemMetrics['memory_usage']]
            );
            $riskScore += 0.2;
        }
        
        // Analyze failed requests
        if (isset($systemMetrics['failed_requests']) && $systemMetrics['failed_requests'] > 100) {
            $anomalies[] = new SecurityAnomaly(
                type: 'high_failed_requests',
                severity: 'high',
                description: 'High number of failed requests detected',
                timestamp: now(),
                metadata: ['failed_requests' => $systemMetrics['failed_requests']]
            );
            $riskScore += 0.4;
        }
        
        // Analyze response time
        if (isset($systemMetrics['response_time']) && $systemMetrics['response_time'] > 1000) {
            $anomalies[] = new SecurityAnomaly(
                type: 'slow_response_time',
                severity: 'medium',
                description: 'Slow response times detected',
                timestamp: now(),
                metadata: ['response_time' => $systemMetrics['response_time']]
            );
            $riskScore += 0.2;
        }
        
        $riskScore = min(1.0, $riskScore); // Cap at 1.0
        
        $recommendations = $this->generateSecurityRecommendations($anomalies, $riskScore);
        
        return new SecurityAnalysis(
            userId: 'system',
            anomalies: $anomalies,
            riskScore: $riskScore,
            recommendations: $recommendations,
            analysisDate: now(),
            analysisPeriod: 1
        );
    }

    /**
     * Generate security recommendations based on anomalies
     */
    private function generateSecurityRecommendations(array $anomalies, float $riskScore): array
    {
        $recommendations = [];
        
        if ($riskScore > 0.7) {
            $recommendations[] = new SecurityRecommendation(
                type: 'immediate_action',
                priority: 'high',
                title: 'High Risk Activity Detected',
                description: 'Immediate security review recommended due to high risk score',
                actions: [
                    'Review recent account activity',
                    'Change password immediately',
                    'Enable two-factor authentication',
                    'Check for unauthorized access'
                ]
            );
        } elseif ($riskScore > 0.4) {
            $recommendations[] = new SecurityRecommendation(
                type: 'moderate_action',
                priority: 'medium',
                title: 'Moderate Risk Activity',
                description: 'Security review recommended due to moderate risk score',
                actions: [
                    'Consider enabling two-factor authentication',
                    'Review recent login activity',
                    'Monitor for unusual patterns'
                ]
            );
        } elseif ($riskScore > 0.2) {
            $recommendations[] = new SecurityRecommendation(
                type: 'monitoring',
                priority: 'low',
                title: 'Low Risk Activity',
                description: 'Periodic monitoring recommended',
                actions: [
                    'Monitor user activity periodically',
                    'Review security settings'
                ]
            );
        }
        
        // Specific recommendations based on anomaly types
        $anomalyTypes = collect($anomalies)->pluck('type')->unique();
        
        if ($anomalyTypes->contains('suspicious_ip')) {
            $recommendations[] = new SecurityRecommendation(
                type: 'ip_security',
                priority: 'medium',
                title: 'IP Address Security',
                description: 'Multiple IP addresses detected for user access',
                actions: ['Review and whitelist trusted IP addresses']
            );
        }
        
        if ($anomalyTypes->contains('multiple_failed_logins')) {
            $recommendations[] = new SecurityRecommendation(
                type: 'login_security',
                priority: 'high',
                title: 'Login Security',
                description: 'Multiple failed login attempts detected',
                actions: ['Enable account lockout after failed attempts']
            );
        }
        
        if ($anomalyTypes->contains('high_cpu_usage')) {
            $recommendations[] = new SecurityRecommendation(
                type: 'system_performance',
                priority: 'medium',
                title: 'System Performance',
                description: 'High CPU usage detected',
                actions: ['Investigate processes causing high CPU usage']
            );
        }
        
        if ($anomalyTypes->contains('high_failed_requests')) {
            $recommendations[] = new SecurityRecommendation(
                type: 'application_security',
                priority: 'high',
                title: 'Application Security',
                description: 'High number of failed requests detected',
                actions: ['Review application logs for error patterns']
            );
        }
        
        return $recommendations;
    }

    /**
     * Analyze login patterns for pattern recognition
     */
    private function extractLoginPatterns(array $recentActivity): LoginPattern
    {
        $logins = collect($recentActivity)
            ->where('type', 'login')
            ->where('action', 'login_success')
            ->sortBy('timestamp');
        
        if ($logins->count() < self::MIN_LOGIN_HISTORY) {
            return new LoginPattern(
                averageHour: null,
                commonDays: [],
                averageFrequency: 0,
                timeZonePattern: null,
                devicePattern: []
            );
        }
        
        // Calculate average login hour
        $hours = $logins->map(fn($login) => Carbon::parse($login['timestamp'])->hour);
        $averageHour = $hours->avg();
        
        // Find common login days
        $days = $logins->map(fn($login) => Carbon::parse($login['timestamp'])->dayOfWeek);
        $commonDays = $days->countBy()->sortDesc()->take(3)->keys()->toArray();
        
        // Calculate login frequency (logins per day)
        $daySpan = $logins->first() && $logins->last() 
            ? Carbon::parse($logins->first()['timestamp'])->diffInDays(Carbon::parse($logins->last()['timestamp'])) + 1
            : 1;
        $averageFrequency = $logins->count() / $daySpan;
        
        // Analyze device patterns
        $devices = $logins->map(fn($login) => $login['user_agent'])->filter()->countBy();
        
        return new LoginPattern(
            averageHour: $averageHour,
            commonDays: $commonDays,
            averageFrequency: $averageFrequency,
            timeZonePattern: $this->detectTimeZonePattern($logins),
            devicePattern: $devices->toArray()
        );
    }

    /**
     * Detect unusual login times
     */
    private function detectUnusualLoginTimes(LoginPattern $pattern): array
    {
        $anomalies = [];
        
        if ($pattern->getAverageHour() === null) {
            return $anomalies;
        }
        
        // Check for logins outside normal hours (more than 4 hours from average)
        $recentLogins = $this->getRecentLogins(1); // Last 24 hours
        
        foreach ($recentLogins as $login) {
            $loginHour = Carbon::parse($login['timestamp'])->hour;
            $hourDifference = abs($loginHour - $pattern->getAverageHour());
            
            // Account for day wrap-around
            $hourDifference = min($hourDifference, 24 - $hourDifference);
            
            if ($hourDifference > 4) {
                $anomalies[] = new SecurityAnomaly(
                    type: 'unusual_login_time',
                    severity: 'medium',
                    description: "Login detected at unusual hour: {$loginHour}:00 (normal: " . round($pattern->getAverageHour()) . ":00)",
                    timestamp: Carbon::parse($login['timestamp']),
                    metadata: [
                        'login_hour' => $loginHour,
                        'normal_hour' => $pattern->getAverageHour(),
                        'hour_difference' => $hourDifference
                    ]
                );
            }
        }
        
        return $anomalies;
    }

    /**
     * Detect unusual locations
     */
    private function detectUnusualLocations(User $user, array $recentActivity): array
    {
        $anomalies = [];
        
        // Get user's known locations from metadata
        $metadata = $user->metadata ?? [];
        $knownLocations = $metadata['known_locations'] ?? [];
        
        // Get recent logins with location data
        $recentLogins = collect($recentActivity)
            ->where('type', 'login')
            ->where('action', 'login_success')
            ->filter(fn($login) => isset($login['location']))
            ->take(10);
        
        foreach ($recentLogins as $login) {
            $location = $login['location'];
            
            if (!$this->isKnownLocation($location, $knownLocations)) {
                $severity = $this->calculateLocationRiskSeverity($location, $knownLocations);
                
                $anomalies[] = new SecurityAnomaly(
                    type: 'unusual_location',
                    severity: $severity,
                    description: "Login from new location: {$location['city']}, {$location['country']}",
                    timestamp: Carbon::parse($login['timestamp']),
                    metadata: [
                        'location' => $location,
                        'ip_address' => $login['ip_address'],
                        'is_vpn' => $location['is_vpn'] ?? false,
                        'is_proxy' => $location['is_proxy'] ?? false
                    ]
                );
                
                // Add to known locations if not too risky
                if ($severity !== 'high') {
                    $this->addKnownLocation($user, $location);
                }
            }
        }
        
        return $anomalies;
    }

    /**
     * Detect unusual devices
     */
    private function detectUnusualDevices(User $user, array $recentActivity): array
    {
        $anomalies = [];
        
        // Get user's known devices from metadata
        $metadata = $user->metadata ?? [];
        $knownDevices = $metadata['known_devices'] ?? [];
        
        // Get recent logins with device data
        $recentLogins = collect($recentActivity)
            ->where('type', 'login')
            ->where('action', 'login_success')
            ->filter(fn($login) => isset($login['user_agent']))
            ->take(10);
        
        foreach ($recentLogins as $login) {
            $userAgent = $login['user_agent'];
            $deviceFingerprint = $this->generateDeviceFingerprint($userAgent);
            
            if (!$this->isKnownDevice($deviceFingerprint, $knownDevices)) {
                $anomalies[] = new SecurityAnomaly(
                    type: 'unusual_device',
                    severity: 'medium',
                    description: "Login from new device: {$this->parseUserAgent($userAgent)['browser']} on {$this->parseUserAgent($userAgent)['os']}",
                    timestamp: Carbon::parse($login['timestamp']),
                    metadata: [
                        'user_agent' => $userAgent,
                        'device_fingerprint' => $deviceFingerprint,
                        'parsed_agent' => $this->parseUserAgent($userAgent)
                    ]
                );
                
                // Add to known devices
                $this->addKnownDevice($user, $deviceFingerprint, $userAgent);
            }
        }
        
        return $anomalies;
    }

    /**
     * Detect suspicious activity patterns
     */
    private function detectSuspiciousActivityPatterns(User $user, array $recentActivity): array
    {
        $anomalies = [];
        
        // Check for rapid successive logins
        $logins = collect($recentActivity)
            ->where('type', 'login')
            ->sortBy('timestamp');
        
        $rapidLogins = [];
        $previousLogin = null;
        
        foreach ($logins as $login) {
            if ($previousLogin) {
                $timeDiff = Carbon::parse($login['timestamp'])->diffInMinutes(Carbon::parse($previousLogin['timestamp']));
                
                if ($timeDiff < 2) { // Less than 2 minutes apart
                    $rapidLogins[] = [$previousLogin, $login];
                }
            }
            $previousLogin = $login;
        }
        
        if (count($rapidLogins) > 0) {
            $anomalies[] = new SecurityAnomaly(
                type: 'rapid_successive_logins',
                severity: 'medium',
                description: "Multiple rapid login attempts detected",
                timestamp: now(),
                metadata: [
                    'rapid_login_count' => count($rapidLogins),
                    'rapid_logins' => $rapidLogins
                ]
            );
        }
        
        // Check for unusual activity volume
        $dailyActivity = collect($recentActivity)
            ->groupBy(fn($activity) => Carbon::parse($activity['timestamp'])->format('Y-m-d'))
            ->map(fn($activities) => $activities->count());
        
        $averageDaily = $dailyActivity->avg();
        $recentDaily = $dailyActivity->take(-3)->avg(); // Last 3 days
        
        if ($recentDaily > $averageDaily * 3) { // 3x normal activity
            $anomalies[] = new SecurityAnomaly(
                type: 'unusual_activity_volume',
                severity: 'medium',
                description: "Unusually high activity volume detected",
                timestamp: now(),
                metadata: [
                    'average_daily_activity' => $averageDaily,
                    'recent_daily_activity' => $recentDaily,
                    'activity_multiplier' => $recentDaily / $averageDaily
                ]
            );
        }
        
        return $anomalies;
    }

    /**
     * Detect brute force attempts
     */
    private function detectBruteForceAttempts(User $user): array
    {
        $anomalies = [];
        
        // Check for multiple failed login attempts
        $failedLogins = collect($this->getRecentLogins(1))
            ->where('action', 'login_failed')
            ->groupBy('ip_address');
        
        foreach ($failedLogins as $ipAddress => $attempts) {
            if ($attempts->count() >= 5) { // 5 or more failed attempts
                $anomalies[] = new SecurityAnomaly(
                    type: 'brute_force_attempt',
                    severity: 'high',
                    description: "Multiple failed login attempts from IP: {$ipAddress}",
                    timestamp: $attempts->last()['timestamp'],
                    metadata: [
                        'ip_address' => $ipAddress,
                        'failed_attempts' => $attempts->count(),
                        'time_span' => $attempts->first()['timestamp']->diffInMinutes($attempts->last()['timestamp'])
                    ]
                );
            }
        }
        
        return $anomalies;
    }

    /**
     * Calculate overall risk score
     */
    private function calculateRiskScore(array $anomalies): float
    {
        if (empty($anomalies)) {
            return 0.0;
        }
        
        $severityWeights = [
            'low' => 0.2,
            'medium' => 0.5,
            'high' => 1.0,
            'critical' => 2.0
        ];
        
        $totalScore = 0;
        foreach ($anomalies as $anomaly) {
            $weight = $severityWeights[$anomaly->getSeverity()] ?? 0.5;
            $totalScore += $weight;
        }
        
        // Normalize to 0-1 scale
        return min(1.0, $totalScore / 5.0);
    }
}