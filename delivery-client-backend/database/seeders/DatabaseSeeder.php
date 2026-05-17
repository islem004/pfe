<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $admin = Role::firstOrCreate(['name' => 'admin', 'description' => 'Administrator']);
        $client = Role::firstOrCreate(['name' => 'client', 'description' => 'B2B Client']);
        $staff = Role::firstOrCreate(['name' => 'staff', 'description' => 'Delivery Staff']);

        // Create admin user
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@delivery.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'System',
                'password' => Hash::make('password123'),
                'phone' => '00000000',
                'is_active' => true,
            ]
        );
        $adminUser->roles()->syncWithoutDetaching([$admin->id => ['assigned_at' => now()]]);
    }
}