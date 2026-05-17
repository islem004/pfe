<?php

// Charge autoload t3a composer (très important)
require __DIR__ . '/../vendor/autoload.php';

use Milon\Barcode\DNS1D;

echo "<h1>Test Barcode avec milon/barcode</h1>";

$generator = new DNS1D();

// Génère barcode HTML (image vectorielle)
$barcodeHtml = $generator->getBarcodeHTML(
    'TEST1234567890',          // Valeur test
    'C128',                    // CODE128 (kif fi model mte3ek)
    2,                         // largeur barres
    100,                       // hauteur
    'black',                   // couleur
    true                       // affiche le texte ta7t barcode
);

echo $barcodeHtml;

echo "<p>Valeur du code : TEST1234567890</p>";
echo "<p>Si tshouf lignes noires (barcode) + texte ta7tha → 5dem parfait !</p>";
echo "<p>Si page blanche ou erreur → check storage/logs/laravel.log</p>";