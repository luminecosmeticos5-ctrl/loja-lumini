import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const MelhorEnvioCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorDetails, setErrorDetails] = useState<{
    error: string | null;
    description: string | null;
    hint: string | null;
    message: string | null;
  }>({
    error: null,
    description: null,
    hint: null,
    message: null
  });

  // Extrair parâmetros uma única vez
  const params = useMemo(() => ({
    code: searchParams.get('code'),
    state: searchParams.get('state') || 'sandbox',
    error: searchParams.get('error'),
    errorDescription: searchParams.get('error_description'),
    hint: searchParams.get('hint'),
    message: searchParams.get('message')
  }), [searchParams]);

  useEffect(() => {
    const handleCallback = async () => {
      console.log("OAUTH_CALLBACK_PARAMS", params);

      // 1. Verificar erro na URL imediatamente
      if (params.error) {
        console.error('OAuth Error from Melhor Envio:', params);
        setErrorDetails({
          error: params.error,
          description: params.errorDescription,
          hint: params.hint,
          message: params.message
        });
        setStatus('error');
        return;
      }

      // 2. Verificar se temos o código
      if (!params.code) {
        console.error("OAUTH_CODE_MISSING");
        setErrorDetails(prev => ({ ...prev, message: 'Código de autorização não encontrado na URL.' }));
        setStatus('error');
        return;
      }

      console.log("OAUTH_CODE_FOUND", params.code);

      try {
        // 3. Buscar configurações do app
        const { data: integration, error: fetchError } = await supabase
          .from('integracoes')
          .select('config')
          .eq('chave', 'melhorenvio')
          .single();

        if (fetchError) throw fetchError;

        const config = (integration?.config as any) || {};
        
        if (!config.client_id || !config.client_secret) {
          throw new Error('Client ID ou Client Secret não configurados no admin.');
        }

        // URL OBRIGATÓRIA SEM BARRA E SEM QUERY PARAMS
        const redirectUri = `${window.location.origin}/admin/integracoes/melhor-envio/callback`;
        console.log("OAUTH_REDIRECT_URI", redirectUri);

        // 4. Chamar Edge Function para trocar código por token
        console.log("OAUTH_EXCHANGING_CODE...");
        const { data, error: invokeError } = await supabase.functions.invoke('melhor-envio', {
          body: {
            action: 'exchange-code',
            code: params.code,
            client_id: config.client_id,
            client_secret: config.client_secret,
            redirect_uri: redirectUri,
            ambiente: params.state
          }
        });

        console.log("OAUTH_TOKEN_RESPONSE", data);

        if (invokeError || (data && data.success === false)) {
          const errorData = data || {};
          console.error('Erro detalhado Melhor Envio API:', errorData);
          throw new Error(errorData.message || errorData.error || invokeError?.message || 'Erro ao processar autorização na API.');
        }

        setStatus('success');
        toast.success('Melhor Envio conectado com sucesso!');
        setTimeout(() => navigate('/admin/integracoes'), 2500);

      } catch (err: any) {
        console.error('Callback error caught:', err);
        setErrorDetails(prev => ({ ...prev, message: err.message || 'Erro interno ao processar autorização.' }));
        setStatus('error');
      }
    };

    handleCallback();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#2D1B4E] mx-auto" />
            <h2 className="text-xl font-bold text-gray-800">Processando Conexão</h2>
            <p className="text-gray-500 text-sm">Estamos finalizando a conexão com o Melhor Envio...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-800">Sucesso!</h2>
            <p className="text-gray-500 text-sm">O Melhor Envio foi conectado. Você será redirecionado em instantes.</p>
            <button 
              onClick={() => navigate('/admin/integracoes')}
              className="mt-4 text-[#2D1B4E] font-bold text-sm underline hover:text-[#1a0f2e]"
            >
              Voltar agora
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="relative">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <AlertTriangle className="h-6 w-6 text-amber-500 absolute bottom-0 right-1/3 translate-x-1/2" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Falha na Integração</h2>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-left space-y-3">
                {errorDetails.error && (
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase block">Erro Técnico</span>
                    <code className="text-xs text-red-700 font-mono break-all">{errorDetails.error}</code>
                  </div>
                )}
                
                {errorDetails.description && (
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase block">Descrição</span>
                    <p className="text-xs text-red-800 leading-tight">{errorDetails.description}</p>
                  </div>
                )}

                {errorDetails.hint && (
                  <div className="pt-2 border-t border-red-200">
                    <span className="text-[10px] font-bold text-amber-600 uppercase block">Dica do Sistema</span>
                    <p className="text-xs text-amber-800 leading-tight italic">{errorDetails.hint}</p>
                  </div>
                )}

                {!errorDetails.error && errorDetails.message && (
                  <p className="text-sm text-red-800 text-center font-medium">{errorDetails.message}</p>
                )}
              </div>
            </div>

            <button 
              onClick={() => navigate('/admin/integracoes')}
              className="w-full bg-[#2D1B4E] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1a0f2e] transition-colors shadow-lg shadow-purple-900/10"
            >
              VOLTAR PARA CONFIGURAÇÕES
            </button>
            
            <p className="text-[10px] text-gray-400">
              Verifique se os dados do App e a URL de Redirecionamento estão corretos no painel do Melhor Envio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MelhorEnvioCallback;