<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Staff;

class StaffRoleSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'staff@test.com')->first();
        $role = Role::where('name', 'staff')->first();
        
        if ($user && $role) {
            $user->roles()->syncWithoutDetaching([
                $role->id => ['assigned_at' => now()]
            ]);

            // Create staff profile if not exists
            Staff::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'employee_id' => 'EMP-STAFF-001',
                    'hire_date'   => now(),
                    'is_active'   => true,
                ]
            );
        }
    }
}