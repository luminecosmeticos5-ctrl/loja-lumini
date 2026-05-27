const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { config, cart, setCartDrawerOpen, appearance }: any = useStore();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchTerm.trim()) {
      setTimeout(() => {
        navigate(`/category/search?q=${encodeURIComponent(searchTerm)}`);
        setSearchTerm('');
      }, 100);
    }
  };

  const cartCount = cart.reduce(
    (acc: any, item: any) => acc + item.quantity,
    0
  );

  const getFirstName = (
    fullName: string | undefined | null
  ) => {
    if (!fullName) return 'CONTA';

    return fullName.split(' ')[0].toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-200 min-h-[60px]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-3 lg:py-5 flex items-center justify-between gap-4">

        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-black p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link
          to="/"
          className="text-black flex flex-col items-start group transition-all duration-300 shrink-0"
          style={{
            fontFamily: 'var(--store-font-primary)',
            fontWeight: 'var(--store-font-weight-menu)',
            letterSpacing: 'var(--store-header-spacing)',
            textTransform:
              'var(--store-header-transform)' as any
          }}
        >
          {appearance?.logo_url ? (
            <img
              src={appearance.logo_url}
              alt={config?.nome_loja || 'Logo'}
              style={{
                width: appearance?.config_logo?.desktop
                  ? `${appearance.config_logo.desktop}px`
                  : 'auto',
                maxWidth: '100%',
                height: 'auto',
                objectFit: 'contain'
              }}
              className="w-auto h-auto max-h-[120px] transition-all duration-300 hidden lg:block"
            />
          ) : (
            <div className="flex flex-col items-center lg:items-start hidden lg:flex">
              <span className="text-lg md:text-xl lg:text-2xl leading-tight font-black">
                {config?.nome_loja?.toUpperCase() ||
                  'LOJA'}
              </span>

              <span className="text-[7px] lg:text-[9px] opacity-60 -mt-0.5">
                {config?.tagline?.toUpperCase() ||
                  'SUA LOJA'}
              </span>
            </div>
          )}

          {/* Mobile Logo */}
          {appearance?.logo_url ? (
            <img
              src={appearance.logo_url}
              alt={config?.nome_loja || 'Logo'}
              style={{
                width: appearance?.config_logo?.mobile
                  ? `${appearance.config_logo.mobile}px`
                  : 'auto',
                maxWidth: '100%',
                height: 'auto',
                objectFit: 'contain'
              }}
              className="w-auto h-auto max-h-[80px] transition-all duration-300 lg:hidden"
            />
          ) : (
            <div className="flex flex-col items-center lg:items-start lg:hidden">
              <span className="text-lg leading-tight font-black">
                {config?.nome_loja?.toUpperCase() ||
                  'LOJA'}
              </span>

              <span className="text-[7px] opacity-60 -mt-0.5">
                {config?.tagline?.toUpperCase() ||
                  'SUA LOJA'}
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Search */}
        <div className="flex-1 max-w-[500px] hidden lg:block mx-8">
          <form
            onSubmit={handleSearch}
            className="relative"
          >
            <input
              type="text"
              placeholder="O que você está procurando?"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="w-full h-14 rounded-full border border-gray-300 bg-gray-100 px-6 pr-16 text-sm outline-none focus:border-black transition-all"
            />

            <button
              type="submit"
              aria-label="Buscar"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black text-white flex items-center justify-center hover:opacity-90 transition-all"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-2 md:gap-4 lg:gap-8 text-black shrink-0">

          <Link
            to={user ? '/minha-conta' : '/login'}
            className="flex flex-col items-center gap-1 group transition-all duration-200"
          >
            <User className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform" />

            <span className="text-[8px] lg:text-[10px] opacity-80 hidden sm:block font-bold">
              {user
                ? getFirstName(
                    user.user_metadata?.full_name
                  )
                : 'LOGIN'}
            </span>
          </Link>

          <Link
            to="/favoritos"
            className="flex flex-col items-center gap-1 group transition-all duration-200 hidden sm:flex"
          >
            <Heart className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform" />

            <span className="text-[8px] lg:text-[10px] opacity-80 font-bold">
              FAVORITOS
            </span>
          </Link>

          <button
            onClick={() => setCartDrawerOpen(true)}
            className="flex flex-col items-center gap-1 group transition-all duration-200"
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform" />

              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-black text-white text-[9px] lg:text-[10px] font-black h-4 w-4 lg:h-5 lg:w-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  {cartCount}
                </span>
              )}
            </div>

            <span className="text-[8px] lg:text-[10px] opacity-80 hidden sm:block font-bold">
              SACOLA
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="px-4 pb-4 lg:hidden bg-white">
        <form
          onSubmit={handleSearch}
          className="relative"
        >
          <input
            type="text"
            placeholder="Busque na loja..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            className="w-full h-12 rounded-full border border-gray-300 bg-gray-100 px-5 pr-14 text-sm outline-none focus:border-black transition-all"
          />

          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black text-white flex items-center justify-center"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
};
