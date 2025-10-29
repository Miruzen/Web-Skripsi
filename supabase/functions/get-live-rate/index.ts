import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Tambahkan POST untuk keamanan
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ✅ URL diperbaiki: Hapus koma di akhir dan pastikan hanya EUR yang diminta
    const url = `https://api.forexrateapi.com/v1/latest?api_key=0b066fbc7db8b3eb0b8583107dde077c&base=EUR&currencies=USD`;

    const apiResponse = await fetch(url);
    const apiBody = await apiResponse.json();

    if (apiBody.error) {
        throw new Error(`API Eksternal Error: ${apiBody.message}`);
    }

    // ✅ LANGKAH KRITIS: Ekstrak nilai rate EUR dari objek 'rates'
    const eurRate = apiBody?.rates?.USD;

    if (typeof eurRate !== 'number') {
        throw new Error("Data EUR/USD tidak valid atau tidak ditemukan.");
    }

    // ✅ Mengembalikan data dalam format yang diharapkan frontend ({ rate: number })
   return new Response(
        JSON.stringify({ rate: eurRate }), 
        { headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});