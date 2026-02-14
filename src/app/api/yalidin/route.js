import { NextResponse } from "next/server";

export async function GET(request) {
  // Récupérer le paramètre wilaya de l'URL
  const { searchParams } = new URL(request.url);
  const wilaya = searchParams.get('wilaya');
  console.log(wilaya)

  if (!wilaya) {
    return NextResponse.json(
      { error: "Le paramètre 'wilaya' est requis" },
      { status: 400 }
    );
  }

  try {
    // Vérifier si les clés API sont présentes
    if (!process.env.YALIDINE_API_ID || !process.env.YALIDINE_API_TOKEN) {
      console.error('Clés API Yalidine manquantes');
      return NextResponse.json([], { status: 200 });
    }

    const apiUrl = `https://api.yalidine.app/v1/centers?wilaya_id=${Number(wilaya)}`;
    
    console.log('Appel API Yalidine:', apiUrl);
    console.log('Headers:', {
      'X-API-ID': process.env.YALIDINE_API_ID?.substring(0, 10) + '...',
      'X-API-TOKEN': process.env.YALIDINE_API_TOKEN?.substring(0, 10) + '...'
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-ID': process.env.YALIDINE_API_ID,
        'X-API-TOKEN': process.env.YALIDINE_API_TOKEN,
        'Content-Type': 'application/json'
      },
      
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Erreur Yalidine ${response.status}:`, errorData);
      
      // Retourner un array vide au lieu d'une erreur pour éviter les crashes
      return NextResponse.json([], { status: 200 });
    }

    const my_data = await response.json();
    console.log("Réponse API Yalidine:", my_data);

    // Vérifier si la réponse contient les données
    const formattedCenters = my_data?.data || my_data || [];

    // S'assurer que c'est un array
    if (!Array.isArray(formattedCenters)) {
      console.error('Les données ne sont pas un array:', formattedCenters);
      return NextResponse.json([]);
    }

    return NextResponse.json(formattedCenters);

  } catch (error) {
    console.error('Erreur API Yalidine:', error);
    return NextResponse.json(
      { 
        error: error.message || "Erreur lors de la récupération des centres",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}