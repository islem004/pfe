<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\DeliveryItemController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\NotificationController;
use Illuminate\Support\Facades\Route;

// ═══════════════════════════════════════
// PUBLIC ROUTES (no token needed)
// ═══════════════════════════════════════

Route::get('/ping', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Backend connected!',
        'time' => now()->toDateTimeString(),
    ]);
});

// Client auth (public)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Admin login (public)
Route::post('/admin/login', [\App\Http\Controllers\Admin\AuthController::class, 'login']);

// Staff login (public)
Route::post('/staff/login', [\App\Http\Controllers\Api\Staff\StaffAuthController::class, 'login']);

// ═══════════════════════════════════════
// PROTECTED ROUTES (token required)
// ═══════════════════════════════════════

// ─── Regions (public — needed on registration form before auth) ───
Route::get('/regions', [\App\Http\Controllers\Admin\RegionController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {

    // ─── Auth (no approval gate — logout/me work for everyone) ───
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/update-password', [AuthController::class, 'updatePassword']);
    Route::post('/auth/profile', [AuthController::class, 'updateProfile']);

    // ─── Client-only routes (approval-gated) ───────────────────────────
    Route::middleware('client.approved')->group(function () {
        // ─── Client Profile ───
        Route::get('/client/profile', [ClientController::class, 'show']);
        Route::put('/client/profile', [ClientController::class, 'update']);

        // ─── Dashboard ───
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // ─── Client Statistics ───
        Route::get('/client/statistics', [\App\Http\Controllers\Api\ClientStatisticsController::class, 'index']);

        // ─── Deliveries ───
        Route::get('/deliveries', [DeliveryController::class, 'index']);
        Route::post('/deliveries', [DeliveryController::class, 'store']);
        Route::get('/deliveries/{id}', [DeliveryController::class, 'show']);
        Route::put('/deliveries/{id}', [DeliveryController::class, 'update']);
        Route::delete('/deliveries/{id}', [DeliveryController::class, 'destroy']);
        Route::get('/deliveries/{id}/track', [DeliveryController::class, 'track']);
        Route::get('/deliveries/{id}/print', [DeliveryController::class, 'printDeliveryForm']);
        Route::post('/deliveries/{id}/rate', [DeliveryController::class, 'rate']);

        // ─── Delivery Items ───
        Route::post('/deliveries/{deliveryId}/items', [DeliveryItemController::class, 'store']);
        Route::put('/deliveries/{deliveryId}/items/{itemId}', [DeliveryItemController::class, 'update']);
        Route::delete('/deliveries/{deliveryId}/items/{itemId}', [DeliveryItemController::class, 'destroy']);

        // ─── Invoices ───
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::get('/invoices/filter', [InvoiceController::class, 'filter']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
        Route::get('/invoices/{id}/print', [InvoiceController::class, 'printInvoice']);

        // ─── Notifications ───
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread', [NotificationController::class, 'unread']);
        Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
        Route::delete('/notifications/delete-all', [NotificationController::class, 'destroyAll']);

        // ─── Complaints (Client) ───
        Route::get('/complaints', [\App\Http\Controllers\Api\ComplaintController::class, 'index']);
        Route::post('/complaints', [\App\Http\Controllers\Api\ComplaintController::class, 'store']);
    });

    // ═══════════════════════════════════
    // ADMIN ROUTES
    // ═══════════════════════════════════
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::post('/logout', [\App\Http\Controllers\Admin\AuthController::class, 'logout']);
        Route::get('/me', [\App\Http\Controllers\Admin\AuthController::class, 'me']);

        // Dashboard
        Route::get('/stats', [\App\Http\Controllers\Admin\DashboardController::class, 'stats']);

        // User management
        Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index']);
        Route::post('/users', [\App\Http\Controllers\Admin\UserController::class, 'store']);
        Route::get('/users/pending', [\App\Http\Controllers\Admin\UserController::class, 'pending']);
        Route::post('/users/{id}/approve', [\App\Http\Controllers\Admin\UserController::class, 'approve']);
        Route::post('/users/{id}/reject', [\App\Http\Controllers\Admin\UserController::class, 'reject']);
        Route::post('/users/{id}/disable', [\App\Http\Controllers\Admin\UserController::class, 'disable']);
        Route::post('/users/{id}/enable', [\App\Http\Controllers\Admin\UserController::class, 'enable']);
        Route::delete('/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'delete']);
        Route::get('/users/{id}/activity', [\App\Http\Controllers\Admin\UserController::class, 'activity']);

        // Deliveries, Staff, Clients
        Route::get('deliveries/filters-data', [\App\Http\Controllers\Admin\LivraisonController::class, 'filtersData']);
        Route::apiResource('deliveries', \App\Http\Controllers\Admin\LivraisonController::class);
        Route::apiResource('staff', \App\Http\Controllers\Admin\LivreurController::class);
        Route::apiResource('clients', \App\Http\Controllers\Admin\ClientB2BController::class);

        // Delivery print
        Route::get('/deliveries/{id}/print', [\App\Http\Controllers\Admin\LivraisonController::class, 'printDeliveryForm']);

        // Invoices
        Route::get('/invoices', [\App\Http\Controllers\Admin\FactureController::class, 'index']);
        Route::post('/invoices/generate', [\App\Http\Controllers\Admin\FactureController::class, 'generate']);
        Route::post('/invoices/generate-missing', [\App\Http\Controllers\Admin\FactureController::class, 'generateAllMissing']);
        Route::delete('/invoices/{id}', [\App\Http\Controllers\Admin\FactureController::class, 'destroy']);

        // Statistics
        Route::get('/statistiques', [\App\Http\Controllers\Admin\StatistiqueController::class, 'index']);
        Route::get('/statistiques/success-rates', [\App\Http\Controllers\Admin\StatistiqueController::class, 'successRates']);
        Route::get('/statistiques/volume', [\App\Http\Controllers\Admin\StatistiqueController::class, 'volumeStats']);
        Route::get('/statistiques/evolution', [\App\Http\Controllers\Admin\StatistiqueController::class, 'evolutionStats']);
        Route::get('/statistiques/meilleur-livreur-mois', [\App\Http\Controllers\Admin\StatistiqueController::class, 'meilleurLivreurDuMois']);
        Route::get('/statistiques/meilleur-livreur-region', [\App\Http\Controllers\Admin\StatistiqueController::class, 'meilleurLivreurParRegion']);
        Route::get('/statistiques/by-region', [\App\Http\Controllers\Admin\StatistiqueController::class, 'byRegion']);
        Route::get('/statistiques/staff-leaderboard', [\App\Http\Controllers\Admin\StatistiqueController::class, 'staffLeaderboard']);
        Route::get('/statistiques/recent', [\App\Http\Controllers\Admin\StatistiqueController::class, 'recentDeliveries']);

        // Regions
        Route::apiResource('regions', \App\Http\Controllers\Admin\RegionController::class);

        // Complaints (Admin)
        Route::get('/complaints', [\App\Http\Controllers\Api\ComplaintController::class, 'adminIndex']);
        Route::put('/complaints/{id}', [\App\Http\Controllers\Api\ComplaintController::class, 'adminUpdate']);
        Route::post('/complaints/{id}/acknowledge', [\App\Http\Controllers\Api\ComplaintController::class, 'adminAcknowledge']);
    });

    // ═══════════════════════════════════
    // STAFF ROUTES
    // ═══════════════════════════════════
    Route::prefix('staff')->group(function () {
        Route::post('/logout', [\App\Http\Controllers\Api\Staff\StaffAuthController::class, 'logout']);
        Route::get('/me', [\App\Http\Controllers\Api\Staff\StaffAuthController::class, 'me']);
        Route::post('/profile', [\App\Http\Controllers\Api\Staff\StaffAuthController::class, 'updateProfile']);

        Route::get('/deliveries', [\App\Http\Controllers\Api\Staff\StaffDeliveryController::class, 'index']);
        Route::get('/deliveries/{id}', [\App\Http\Controllers\Api\Staff\StaffDeliveryController::class, 'show']);
        Route::get('/my-rank', [\App\Http\Controllers\Api\Staff\StaffDeliveryController::class, 'myRank']);
        Route::post('/scan', [\App\Http\Controllers\Api\Staff\StaffDeliveryController::class, 'scanBarcode']);
        Route::put('/deliveries/{id}/status', [\App\Http\Controllers\Api\Staff\StaffDeliveryController::class, 'updateStatus']);
        Route::post('/deliveries/{id}/proof', [\App\Http\Controllers\Api\Staff\StaffDeliveryController::class, 'uploadProof']);
        Route::get('/statistics', [\App\Http\Controllers\Api\Staff\StaffDeliveryController::class, 'statistics']);

        Route::get('/notifications', [\App\Http\Controllers\Api\Staff\StaffNotificationController::class, 'index']);
        Route::get('/notifications/unread', [\App\Http\Controllers\Api\Staff\StaffNotificationController::class, 'unread']);
        Route::put('/notifications/{id}/read', [\App\Http\Controllers\Api\Staff\StaffNotificationController::class, 'markAsRead']);
        Route::put('/notifications/read-all', [\App\Http\Controllers\Api\Staff\StaffNotificationController::class, 'markAllAsRead']);
    });
});