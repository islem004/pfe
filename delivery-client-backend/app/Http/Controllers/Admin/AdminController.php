<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    private $users = [
        ['id' => 1, 'nom' => 'Client 1', 'role' => 'client', 'is_active' => false],
        ['id' => 2, 'nom' => 'Livreur 1', 'role' => 'livreur', 'is_active' => false],
        ['id' => 3, 'nom' => 'Admin', 'role' => 'admin', 'is_active' => true],
    ];

    private $livraisons = [
        [
            'id' => 1,
            'client' => 'Client 1',
            'articles' => ['PC', 'Souris'],
            'status' => 'en_attente',
            'date' => '2026-02-23'
        ],
        [
            'id' => 2,
            'client' => 'Client 2',
            'articles' => ['Clavier'],
            'status' => 'livree',
            'date' => '2026-02-20'
        ],
        [
            'id' => 3,
            'client' => 'Client 3',
            'articles' => ['Ecran'],
            'status' => 'echouee',
            'date' => '2026-02-18'
        ]
    ];

    public function users()
    {
        return response()->json($this->users);
    }

    public function pendingUsers()
    {
        $pending = [];

        foreach ($this->users as $user) {
            if ($user['is_active'] == false) {
                $pending[] = $user;
            }
        }

        return response()->json($pending);
    }

    public function confirmUser($id)
    {
        foreach ($this->users as &$user) {
            if ($user['id'] == $id) {
                $user['is_active'] = true;

                return response()->json([
                    'message' => "Utilisateur confirmé",
                    'user' => $user
                ]);
            }
        }

        return response()->json([
            'message' => 'Utilisateur non trouvé'
        ], 404);
    }

    public function disableUser($id)
    {
        foreach ($this->users as &$user) {
            if ($user['id'] == $id) {
                $user['is_active'] = false;

                return response()->json([
                    'message' => "Utilisateur désactivé",
                    'user' => $user
                ]);
            }
        }

        return response()->json([
            'message' => 'Utilisateur non trouvé'
        ], 404);
    }

    public function deleteUser($id)
    {
        foreach ($this->users as $key => $user) {
            if ($user['id'] == $id) {

                unset($this->users[$key]);

                return response()->json([
                    'message' => "Utilisateur supprimé",
                    'remaining_users' => array_values($this->users)
                ]);
            }
        }

        return response()->json([
            'message' => 'Utilisateur non trouvé'
        ], 404);
    }

    public function livraisons()
    {
        return response()->json($this->livraisons);
    }

    public function updateStatus($id, $status)
    {
        foreach ($this->livraisons as &$livraison) {
            if ($livraison['id'] == $id) {

                $livraison['status'] = $status;

                return response()->json([
                    'message' => 'Statut mis à jour',
                    'livraison' => $livraison
                ]);
            }
        }

        return response()->json([
            'message' => 'Livraison non trouvée'
        ], 404);
    }

    public function statistiques()
    {
        $total = count($this->livraisons);

        $enAttente = 0;
        $livree = 0;
        $echouee = 0;

        foreach ($this->livraisons as $livraison) {
            if ($livraison['status'] == 'en_attente') {
                $enAttente++;
            }
            elseif ($livraison['status'] == 'livree') {
                $livree++;
            }
            elseif ($livraison['status'] == 'echouee') {
                $echouee++;
            }
        }

        return response()->json([
            'total' => $total,
            'en_attente' => $enAttente,
            'livree' => $livree,
            'echouee' => $echouee
        ]);
    }

    public function generateFacture($id)
    {
        foreach ($this->livraisons as $livraison) {
            if ($livraison['id'] == $id) {

                $facture = [
                    'facture_id' => 'FAC-' . date('Y') . '-' . str_pad($id, 3, '0', STR_PAD_LEFT),
                    'livraison_id' => $livraison['id'],
                    'client' => $livraison['client'],
                    'articles' => $livraison['articles'],
                    'montant_total' => rand(500, 2000),
                    'date' => date('Y-m-d')
                ];

                return response()->json($facture);
            }
        }

        return response()->json([
            'message' => 'Livraison non trouvée'
        ], 404);
    }
}
