<?php

namespace App\Domain\Production\ValueObjects;

use DateTimeImmutable;

/**
 * Labor Schedule Value Object
 * 
 * Represents the schedule for labor assignments with skill matching
 * and availability tracking.
 */
final class LaborSchedule
{
    /**
     * @param array<array> $assignments
     */
    public function __construct(
        private array $assignments
    ) {}

    public function getAssignments(): array
    {
        return $this->assignments;
    }

    /**
     * Get assignments for specific role
     */
    public function getAssignmentsForRole(string $role): array
    {
        return array_filter(
            $this->assignments,
            fn(array $assignment) => $assignment['role'] === $role
        );
    }

    /**
     * Get assignments for specific phase
     */
    public function getAssignmentsForPhase(string $phase): array
    {
        return array_filter(
            $this->assignments,
            fn(array $assignment) => $assignment['phase'] === $phase
        );
    }

    /**
     * Get specialized role assignments
     */
    public function getSpecializedAssignments(): array
    {
        $specializedRoles = ['design_engineer', 'quality_inspector', 'finishing_specialist'];
        
        return array_filter(
            $this->assignments,
            fn(array $assignment) => in_array($assignment['role'], $specializedRoles)
        );
    }

    /**
     * Get unavailable assignments
     */
    public function getUnavailableAssignments(): array
    {
        return array_filter(
            $this->assignments,
            fn(array $assignment) => $assignment['availability_status'] !== 'available'
        );
    }

    /**
     * Get overtime assignments
     */
    public function getOvertimeAssignments(): array
    {
        return array_filter(
            $this->assignments,
            fn(array $assignment) => $assignment['hours_per_day'] > 8
        );
    }

    /**
     * Get labor utilization summary
     */
    public function getUtilizationSummary(): array
    {
        $utilization = [];
        
        foreach ($this->assignments as $assignment) {
            $role = $assignment['role'];
            
            if (!isset($utilization[$role])) {
                $utilization[$role] = [
                    'role' => $role,
                    'total_hours' => 0,
                    'total_assignments' => 0,
                    'total_workers' => 0,
                    'phases' => [],
                    'skill_levels' => [],
                    'availability_issues' => 0,
                    'overtime_assignments' => 0
                ];
            }
            
            $utilization[$role]['total_hours'] += $assignment['total_hours'];
            $utilization[$role]['total_assignments']++;
            $utilization[$role]['total_workers'] += $assignment['number_of_workers'];
            
            if (!in_array($assignment['phase'], $utilization[$role]['phases'])) {
                $utilization[$role]['phases'][] = $assignment['phase'];
            }
            
            if (!in_array($assignment['skill_level'], $utilization[$role]['skill_levels'])) {
                $utilization[$role]['skill_levels'][] = $assignment['skill_level'];
            }
            
            if ($assignment['availability_status'] !== 'available') {
                $utilization[$role]['availability_issues']++;
            }
            
            if ($assignment['hours_per_day'] > 8) {
                $utilization[$role]['overtime_assignments']++;
            }
        }
        
        return array_values($utilization);
    }

    /**
     * Get skill requirements summary
     */
    public function getSkillRequirementsSummary(): array
    {
        $skills = [];
        
        foreach ($this->assignments as $assignment) {
            foreach ($assignment['required_skills'] as $skill) {
                if (!isset($skills[$skill])) {
                    $skills[$skill] = [
                        'skill' => $skill,
                        'assignments' => 0,
                        'total_hours' => 0,
                        'roles' => []
                    ];
                }
                
                $skills[$skill]['assignments']++;
                $skills[$skill]['total_hours'] += $assignment['total_hours'];
                
                if (!in_array($assignment['role'], $skills[$skill]['roles'])) {
                    $skills[$skill]['roles'][] = $assignment['role'];
                }
            }
        }
        
        return array_values($skills);
    }

    /**
     * Get labor conflicts (overlapping assignments exceeding capacity)
     */
    public function getConflicts(): array
    {
        $conflicts = [];
        $roleAssignments = [];

        // Group assignments by role
        foreach ($this->assignments as $assignment) {
            $role = $assignment['role'];
            if (!isset($roleAssignments[$role])) {
                $roleAssignments[$role] = [];
            }
            $roleAssignments[$role][] = $assignment;
        }

        // Check for overlapping assignments
        foreach ($roleAssignments as $role => $assignments) {
            // Assume maximum 2 workers per role available
            $maxConcurrentWorkers = 2;
            
            for ($i = 0; $i < count($assignments); $i++) {
                $concurrentWorkers = $assignments[$i]['number_of_workers'];
                $assignment1 = $assignments[$i];
                
                for ($j = $i + 1; $j < count($assignments); $j++) {
                    $assignment2 = $assignments[$j];
                    
                    if ($this->assignmentsOverlap($assignment1, $assignment2)) {
                        $concurrentWorkers += $assignment2['number_of_workers'];
                    }
                }
                
                if ($concurrentWorkers > $maxConcurrentWorkers) {
                    $conflicts[] = [
                        'type' => 'labor_overallocation',
                        'role' => $role,
                        'required_workers' => $concurrentWorkers,
                        'available_workers' => $maxConcurrentWorkers,
                        'assignment' => [
                            'phase' => $assignment1['phase'],
                            'start_date' => $assignment1['start_date']->format('Y-m-d H:i:s'),
                            'end_date' => $assignment1['end_date']->format('Y-m-d H:i:s')
                        ],
                        'message' => "Role {$role} requires {$concurrentWorkers} workers but only {$maxConcurrentWorkers} available"
                    ];
                }
            }
        }

        return $conflicts;
    }

    /**
     * Check if two assignments overlap
     */
    private function assignmentsOverlap(array $assignment1, array $assignment2): bool
    {
        return $assignment1['start_date'] < $assignment2['end_date'] && 
               $assignment2['start_date'] < $assignment1['end_date'];
    }

    /**
     * Get total labor hours
     */
    public function getTotalHours(): int
    {
        return array_reduce(
            $this->assignments,
            fn(int $total, array $assignment) => $total + $assignment['total_hours'],
            0
        );
    }

    /**
     * Get total labor cost
     */
    public function getTotalCost(): int
    {
        return array_reduce(
            $this->assignments,
            fn(int $total, array $assignment) => 
                $total + ($assignment['hourly_rate']->getAmount() * $assignment['total_hours']),
            0
        );
    }

    /**
     * Get role with highest utilization
     */
    public function getHighestUtilizationRole(): ?array
    {
        $utilization = $this->getUtilizationSummary();
        
        if (empty($utilization)) {
            return null;
        }
        
        usort($utilization, fn($a, $b) => $b['total_hours'] <=> $a['total_hours']);
        
        return $utilization[0];
    }

    /**
     * Get critical skill gaps
     */
    public function getCriticalSkillGaps(): array
    {
        $skillRequirements = $this->getSkillRequirementsSummary();
        $criticalSkills = ['precision_etching', 'artistic_design', 'technical_drawing', 'quality_control'];
        
        $gaps = [];
        foreach ($criticalSkills as $skill) {
            $found = false;
            foreach ($skillRequirements as $requirement) {
                if ($requirement['skill'] === $skill) {
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                $gaps[] = [
                    'skill' => $skill,
                    'severity' => 'critical',
                    'message' => "Critical skill '{$skill}' not covered in labor assignments"
                ];
            }
        }
        
        return $gaps;
    }

    public function toArray(): array
    {
        return [
            'assignments' => array_map(function($assignment) {
                return [
                    'role' => $assignment['role'],
                    'skill_level' => $assignment['skill_level'],
                    'required_skills' => $assignment['required_skills'],
                    'phase' => $assignment['phase'],
                    'start_date' => $assignment['start_date']->format('Y-m-d H:i:s'),
                    'end_date' => $assignment['end_date']->format('Y-m-d H:i:s'),
                    'hours_per_day' => $assignment['hours_per_day'],
                    'total_hours' => $assignment['total_hours'],
                    'number_of_workers' => $assignment['number_of_workers'],
                    'hourly_rate' => [
                        'amount' => $assignment['hourly_rate']->getAmount(),
                        'currency' => $assignment['hourly_rate']->getCurrency()
                    ],
                    'overtime_allowed' => $assignment['overtime_allowed'],
                    'availability_status' => $assignment['availability_status']
                ];
            }, $this->assignments),
            'total_assignments' => count($this->assignments),
            'total_hours' => $this->getTotalHours(),
            'total_cost' => $this->getTotalCost(),
            'utilization_summary' => $this->getUtilizationSummary(),
            'skill_requirements_summary' => $this->getSkillRequirementsSummary(),
            'specialized_assignments' => count($this->getSpecializedAssignments()),
            'unavailable_assignments' => count($this->getUnavailableAssignments()),
            'overtime_assignments' => count($this->getOvertimeAssignments()),
            'critical_skill_gaps' => $this->getCriticalSkillGaps(),
            'conflicts' => $this->getConflicts()
        ];
    }
}