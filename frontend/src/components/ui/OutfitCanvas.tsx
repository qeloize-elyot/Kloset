import type { ClothingItem } from '../../lib/types'

interface Piece {
  id: number
  name?: string | null
  category: string
  dominant_color?: string | null
  image?: string | null
}

interface OutfitCanvasProps {
  pieces: Piece[]
  className?: string
  compact?: boolean
}

/** Flat-lay vertical stack — linguagem visual de apps como Whering. */
export function OutfitCanvas({ pieces, className = '', compact = false }: OutfitCanvasProps) {
  if (!pieces.length) {
    return (
      <div className={`flex items-center justify-center bg-cream-100 ${compact ? 'h-40' : 'h-64'} ${className}`}>
        <p className="text-xs text-ink-400 uppercase tracking-wider">Sem peças</p>
      </div>
    )
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-1 bg-[#f7f4ef] px-4 ${
        compact ? 'py-4 min-h-[160px]' : 'py-8 min-h-[280px]'
      } ${className}`}
    >
      {pieces.map((p, i) => {
        const img = p.image
        const size = compact ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-24 w-24 sm:h-28 sm:w-28'
        return (
          <div
            key={`${p.id}-${i}`}
            className={`${size} flex items-center justify-center rounded-sm overflow-hidden shadow-sm`}
            style={{
              backgroundColor: img ? '#fff' : p.dominant_color || '#e8e4de',
              backgroundImage: img
                ? 'repeating-conic-gradient(#efeae2 0% 25%, #fff 0% 50%)'
                : undefined,
              backgroundSize: img ? '8px 8px' : undefined,
              zIndex: pieces.length - i,
            }}
          >
            {img ? (
              <img src={img} alt={p.name || p.category} className="h-full w-full object-contain" />
            ) : (
              <span className="text-[9px] uppercase tracking-wider text-white/90 mix-blend-difference px-1 text-center">
                {p.category}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function clothingToPiece(item: ClothingItem): Piece {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    dominant_color: item.dominant_color,
    image: item.image_clean || item.image_front,
  }
}
