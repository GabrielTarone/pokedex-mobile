import { useMemo, useState, type ReactNode } from 'react'

type Pokemon = {
  id: number
  name: string
  types: string[]
  image: string
  color: string
}

const pokemon: Pokemon[] = [
  { id: 1, name: 'Bulbasaur', types: ['Grama', 'Veneno'], image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/1.png', color: 'mint' },
  { id: 4, name: 'Charmander', types: ['Fogo'], image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/4.png', color: 'peach' },
  { id: 7, name: 'Squirtle', types: ['Água'], image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/7.png', color: 'sky' },
  { id: 25, name: 'Pikachu', types: ['Elétrico'], image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/25.png', color: 'sun' },
  { id: 39, name: 'Jigglypuff', types: ['Fada'], image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/39.png', color: 'rose' },
  { id: 94, name: 'Gengar', types: ['Fantasma', 'Veneno'], image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/94.png', color: 'purple' },
]

const typeColors: Record<string, string> = {
  Grama: 'green',
  Veneno: 'violet',
  Fogo: 'orange',
  Água: 'blue',
  Elétrico: 'yellow',
  Fada: 'pink',
  Fantasma: 'indigo',
}

function Icon({ name, filled = false }: { name: 'search' | 'heart' | 'home' | 'user' | 'chevron' | 'spark'; filled?: boolean }) {
  const paths: Record<string, ReactNode> = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    heart: <path d="M20.8 5.7c-1.7-2-4.9-2.1-6.8-.2L12 7.4l-2-1.9C8.1 3.6 4.9 3.7 3.2 5.7c-1.6 1.9-1.4 4.8.3 6.6L12 21l8.5-8.7c1.7-1.8 1.9-4.7.3-6.6Z" />,
    home: <><path d="m3 10 9-7 9 7" /><path d="M5.5 9v11h13V9M9 20v-6h6v6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21c.7-4.2 3.2-6.5 7.5-6.5s6.8 2.3 7.5 6.5" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    spark: <path d="m12 2 1.4 5.4L18 10l-4.6 2.6L12 18l-1.4-5.4L6 10l4.6-2.6L12 2Z" />,
  }
  return <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function Pokeball({ small = false }: { small?: boolean }) {
  return <span className={small ? 'pokeball pokeball-small' : 'pokeball'} aria-hidden="true"><span /></span>
}

function PokemonCard({ item, favorite, onFavorite }: { item: Pokemon; favorite: boolean; onFavorite: () => void }) {
  return (
    <article className={`pokemon-card ${item.color}`}>
      <div className="card-copy">
        <span className="pokemon-number">#{String(item.id).padStart(3, '0')}</span>
        <h3>{item.name}</h3>
        <div className="types">
          {item.types.map((type) => <span className={`type ${typeColors[type]}`} key={type}>{type}</span>)}
        </div>
      </div>
      <Pokeball />
      <img src={item.image} alt={item.name} />
      <button className={`favorite-button ${favorite ? 'active' : ''}`} onClick={onFavorite} aria-label={`${favorite ? 'Remover' : 'Adicionar'} ${item.name} dos favoritos`}>
        <Icon name="heart" filled={favorite} />
      </button>
    </article>
  )
}

function EmptyFavorites({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-ball"><Pokeball /></div>
      <h2>Sua equipe está vazia</h2>
      <p>Toque no coração de um Pokémon para montar a sua coleção favorita.</p>
      <button className="primary-button" onClick={onExplore}>Explorar Pokémon</button>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<'pokedex' | 'favorites' | 'profile'>('pokedex')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('Todos')
  const [favorites, setFavorites] = useState<number[]>([25, 94])

  const filtered = useMemo(() => pokemon.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase()) || String(item.id).includes(query)
    return matchesQuery && (type === 'Todos' || item.types.includes(type))
  }), [query, type])

  function toggleFavorite(id: number) {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const shownPokemon = tab === 'favorites' ? pokemon.filter((item) => favorites.includes(item.id)) : filtered

  return (
    <main className="app-shell">
      <section className="phone">
        <div className="status-bar"><span>9:41</span><div className="status-icons"><i /><i /><b>87</b></div></div>

        <div className="content">
          {tab === 'pokedex' && (
            <>
              <header className="hero">
                <div className="brand"><Pokeball small /><span>POKÉDEX</span></div>
                <div className="hero-title"><div><span className="eyebrow">REGIÃO DE KANTO</span><h1>Quem você<br />vai encontrar?</h1></div><span className="floating-pika">ϟ</span></div>
                <label className="search-box">
                  <Icon name="search" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou número" aria-label="Buscar Pokémon" />
                  <kbd>⌘ K</kbd>
                </label>
              </header>

              <div className="section-heading">
                <div><span className="eyebrow dark">EXPLORE</span><h2>Pokémon</h2></div>
                <button className="see-all" onClick={() => { setType('Todos'); setQuery('') }}>Ver todos <Icon name="chevron" /></button>
              </div>

              <div className="filter-row">
                {['Todos', 'Grama', 'Fogo', 'Água', 'Elétrico'].map((item) => (
                  <button className={type === item ? 'filter active' : 'filter'} onClick={() => setType(item)} key={item}>{item}</button>
                ))}
              </div>
            </>
          )}

          {tab === 'favorites' && (
            <header className="simple-header">
              <span className="eyebrow dark">SUA COLEÇÃO</span>
              <h1>Favoritos</h1>
              <p>{favorites.length} Pokémon prontos para a aventura.</p>
            </header>
          )}

          {tab === 'profile' ? (
            <div className="profile-screen">
              <header className="simple-header"><span className="eyebrow dark">TREINADOR</span><h1>Meu perfil</h1></header>
              <div className="trainer-card">
                <div className="avatar"><Icon name="user" /></div>
                <div><span className="eyebrow">TREINADOR NÍVEL 12</span><h2>Ash Silva</h2><p>Começou em Pallet Town</p></div>
                <Pokeball small />
              </div>
              <div className="stats">
                <div><strong>48</strong><span>Capturados</span></div>
                <div><strong>{favorites.length}</strong><span>Favoritos</span></div>
                <div><strong>7</strong><span>Insígnias</span></div>
              </div>
              <div className="menu-list">
                {['Minhas conquistas', 'Regiões exploradas', 'Configurações'].map((item) => <button key={item}><span><Icon name="spark" />{item}</span><Icon name="chevron" /></button>)}
              </div>
            </div>
          ) : shownPokemon.length > 0 ? (
            <div className="pokemon-grid">
              {shownPokemon.map((item) => <PokemonCard key={item.id} item={item} favorite={favorites.includes(item.id)} onFavorite={() => toggleFavorite(item.id)} />)}
            </div>
          ) : tab === 'favorites' ? <EmptyFavorites onExplore={() => setTab('pokedex')} /> : (
            <div className="no-results"><Pokeball /><h2>Nenhum Pokémon encontrado</h2><p>Tente buscar por outro nome ou número.</p></div>
          )}
        </div>

        <nav className="bottom-nav" aria-label="Navegação principal">
          <button className={tab === 'pokedex' ? 'active' : ''} onClick={() => setTab('pokedex')}><Icon name="home" /><span>Pokédex</span></button>
          <button className={tab === 'favorites' ? 'active' : ''} onClick={() => setTab('favorites')}><Icon name="heart" filled={tab === 'favorites'} /><span>Favoritos</span>{favorites.length > 0 && <em>{favorites.length}</em>}</button>
          <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}><Icon name="user" /><span>Perfil</span></button>
        </nav>
      </section>
    </main>
  )
}
