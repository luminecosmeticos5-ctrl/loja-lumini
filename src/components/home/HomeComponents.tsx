import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  RefreshCcw,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../product/ProductComponents';

export const HeroBanner = () => {
  const { banners }: any = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const fallbackBanner = {
    id: 'fallback-banner',
    imagem_desktop:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1600',
    imagem_mobile:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=900',
    titulo: 'Nova Coleção',
    subtitulo: 'Template premium totalmente responsivo',
    texto_botao: 'EXPLORAR AGORA',
    link_botao: '/produtos',
    posicao_texto: 'left',
    ativo: true,
  };

  const activeBanners =
    Array.isArray(banners)
      ? banners.filter((b: any) => b?.ativo !== false)
      : [];

  const safeBanners =
    activeBanners.length > 0
      ? activeBanners
      : [fallbackBanner];

  useEffect(() => {
    if (safeBanners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % safeBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [safeBanners.length]);

  return (
    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden group bg-brand-secondary">
      {safeBanners.map((banner: any, index: number) => (
        <div
          key={banner.id || index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide
              ? 'opacity-100'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <picture className="w-full h-full">
            <source
              media="(max-width: 768px)"
              srcSet={
                banner.imagem_mobile ||
                banner.imagem_desktop ||
                banner.imagem
              }
            />

            <img
              src={
                banner.imagem_desktop ||
                banner.imagem ||
                banner.image ||
                fallbackBanner.imagem_desktop
              }
              alt={banner.titulo || banner.title || 'Banner'}
              className="w-full h-full object-cover object-center"
              loading={index === 0 ? 'eager' : 'lazy'}
              onError={(e: any) => {
                e.target.src = fallbackBanner.imagem_desktop;
              }}
            />
          </picture>

          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-transparent" />

          <div className="absolute inset-0 flex items-center">
            <div className="max-w-[1400px] mx-auto w-full px-6 md:px-24">
              <div
                className={`max-w-xl animate-in fade-in slide-in-from-left-8 duration-1000 ${
                  banner.posicao_texto === 'centro'
                    ? 'mx-auto text-center items-center flex flex-col'
                    : banner.posicao_texto === 'direita'
                    ? 'ml-auto text-right items-end flex flex-col'
                    : ''
                }`}
              >
                {(banner.titulo || banner.title) && (
                  <h1
                    className="text-4xl md:text-7xl leading-tight drop-shadow-lg mb-4"
                    style={{
                      fontFamily: 'var(--store-font-heading)',
                      fontWeight: 'var(--store-font-weight-title)',
                      letterSpacing: 'var(--store-header-spacing)',
                      textTransform:
                        'var(--store-header-transform)' as any
                    }}
                  >
                    {banner.titulo || banner.title}
                  </h1>
                )}

                {(banner.subtitulo || banner.subtitle) && (
                  <p className="text-white text-lg md:text-xl mb-10 font-medium max-w-lg drop-shadow-md">
                    {banner.subtitulo || banner.subtitle}
                  </p>
                )}

                {(banner.texto_botao ||
                  banner.textoBotao ||
                  banner.button_text) && (
                  <Link
                    to={
                      banner.link_botao ||
                      banner.linkBotao ||
                      banner.button_link ||
                      '/'
                    }
                    className="inline-block bg-brand-primary hover:opacity-95 text-brand-primary-foreground px-12 py-4 transition-all duration-300 rounded-brand-button shadow-2xl"
                    style={{
                      backgroundColor: banner.cor_botao,
                      letterSpacing: 'var(--store-header-spacing)',
                      fontFamily: 'var(--store-font-heading)',
                      fontWeight:
                        'var(--store-font-weight-title)',
                      textTransform:
                        'var(--store-header-transform)' as any
                    }}
                  >
                    {banner.texto_botao ||
                      banner.textoBotao ||
                      banner.button_text ||
                      'EXPLORAR AGORA'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-10">
        {safeBanners.map((_: any, index: number) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 transition-all rounded-full ${
              index === currentSlide
                ? 'w-12 bg-white'
                : 'w-4 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      <button
        onClick={() =>
          setCurrentSlide(
            (prev) =>
              (prev - 1 + safeBanners.length) %
              safeBanners.length
          )
        }
        className="absolute left-8 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 border border-white/20 z-10"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={() =>
          setCurrentSlide(
            (prev) => (prev + 1) % safeBanners.length
          )
        }
        className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 border border-white/20 z-10"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
};

export const CategoryCircleIcons = () => {
  const { categories }: any = useStore();

  const safeCategories = Array.isArray(categories)
    ? categories
    : [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-12 bg-brand-background">
      <div className="flex gap-10 md:gap-12 overflow-x-auto no-scrollbar pb-6 md:justify-center">
        {safeCategories.map((item: any, i: number) => (
          <Link
            to={`/category/${item.slug}`}
            key={i}
            className="flex flex-col items-center gap-3 shrink-0 cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-secondary transition-all duration-300 shadow-sm bg-brand-secondary ring-offset-2 ring-brand-secondary/20">
              <img
                src={
                  item.imagem_url ||
                  item.imagem ||
                  item.image ||
                  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200&h=200&fit=crop'
                }
                alt={item.nome || item.name}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
                onError={(e: any) => {
                  e.target.src =
                    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200&h=200&fit=crop';
                }}
              />
            </div>

            <span
              className="text-xs text-brand-foreground tracking-tight text-center transition-colors"
              style={{
                fontFamily: 'var(--store-font-body)',
                fontWeight: 'var(--store-font-weight-text)'
              }}
            >
              {item.nome || item.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export const Benefits = () => {
  const items = [
    {
      title: 'Frete Grátis',
      desc: 'Acima de R$ 199',
      icon: Zap
    },
    {
      title: 'Troca Grátis',
      desc: 'Primeira troca por nossa conta',
      icon: RefreshCcw
    },
    {
      title: '5x Sem Juros',
      desc: 'No cartão de crédito',
      icon: CreditCard
    },
    {
      title: 'Compra Segura',
      desc: 'SSL & Pagamento Protegido',
      icon: ShieldCheck
    },
  ];

  return (
    <section className="border-t border-b border-brand-border py-8 bg-brand-card mb-4">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-brand-border">
        {items.map((b, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 md:px-10 justify-center md:justify-start"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-brand-secondary rounded-full shrink-0 shadow-sm">
              <b.icon
                className="w-6 h-6 text-[var(--price-color)]"
                strokeWidth={2}
              />
            </div>

            <div>
              <p
                className="text-sm leading-tight mb-0.5"
                style={{
                  fontFamily: 'var(--store-font-heading)',
                  fontWeight:
                    'var(--store-font-weight-title)',
                  color: 'var(--store-foreground)'
                }}
              >
                {b.title}
              </p>

              <p
                className="text-[11px] font-medium"
                style={{
                  fontFamily: 'var(--store-font-body)',
                  fontWeight:
                    'var(--store-font-weight-text)',
                  color: 'var(--store-muted)'
                }}
              >
                {b.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const EditorialSection = () => {
  const { products, editorial }: any = useStore();

  const safeProducts = Array.isArray(products)
    ? products
    : [];

  const validProducts = safeProducts.filter(
    (p: any) =>
      p?.status === 'active' &&
      (
        (p?.images && p.images.length > 0) ||
        p?.main_image
      )
  );

  const productIds = editorial?.produtos_ids || [];

  const produtosColecao = validProducts
    .filter((p: any) => productIds.includes(p.id))
    .slice(0, 4);

  const displayProducts =
    produtosColecao.length > 0
      ? produtosColecao
      : validProducts.slice(0, 4);

  if (!editorial || editorial.ativo === false)
    return null;

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2
          className="flex items-center gap-3 text-xl font-bold uppercase tracking-wide"
          style={{
            fontFamily: 'var(--store-font-heading)',
            fontWeight: 'var(--store-font-weight-title)',
            color: 'var(--store-foreground)'
          }}
        >
          <span className="w-1.5 h-7 bg-[var(--price-color)] rounded-full inline-block" />
          DESTAQUES DA COLEÇÃO
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-0 rounded-brand-card overflow-hidden shadow-xl border border-brand-border">
        <div className="relative min-h-[400px] md:min-h-[500px] group overflow-hidden">
          <img
            src={
              editorial.imagem_url ||
              'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000'
            }
            alt={editorial.titulo}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="absolute bottom-10 left-10 right-10">
            <p className="text-brand-secondary text-xs tracking-[0.3em] uppercase font-bold mb-3 drop-shadow-sm">
              {editorial.subtitulo}
            </p>

            <h3
              className="text-white text-5xl mb-4"
              style={{
                fontFamily: 'var(--store-font-heading)',
                fontWeight:
                  'var(--store-font-weight-title)'
              }}
            >
              {editorial.titulo}
            </h3>

            <p className="text-white/80 text-base mb-8 max-w-xs font-medium leading-relaxed">
              {editorial.descricao ||
                'Peças que contam histórias. Descubra a elegância atemporal da nova coleção.'}
            </p>

            <Link
              to={editorial.link_botao || '/'}
              className="border-2 border-[var(--store-button-text)] text-[var(--store-button-text)] text-xs font-bold px-8 py-3.5 hover:bg-[var(--store-button-text)] hover:text-black transition-all duration-300 rounded-brand-button"
              style={{
                letterSpacing:
                  'var(--store-header-spacing)',
                textTransform:
                  'var(--store-header-transform)' as any
              }}
            >
              {editorial.texto_botao || 'EXPLORAR'}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-brand-border">
          {displayProducts.map((p: any) => (
            <div
              key={p.id}
              className="bg-brand-card p-2 md:p-4"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
