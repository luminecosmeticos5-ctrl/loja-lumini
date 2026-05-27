// @ts-ignore
import { loadMercadoPago } from '@mercadopago/sdk-js';

export async function initMP() {
  // In a real app, we'd fetch the public key from the Supabase 'integracoes' table
  const publicKey = 'TEST-f6a8b...'; // Mock public key
  await loadMercadoPago();
  return new (window as any).MercadoPago(publicKey, { locale: 'pt-BR' });
}

export async function criarPreferencia(itens: any[], comprador: any, endereco: any) {
  // Mock API call to create preference
  return { id: 'pref_12345', init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=12345' };
}
