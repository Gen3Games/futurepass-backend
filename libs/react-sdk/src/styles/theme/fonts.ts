import objektivMk1BdWoff from '../../components/assets/fonts/ObjektivMk1_W_Bd.woff'
import objektivMk1BdWoff2 from '../../components/assets/fonts/ObjektivMk1_W_Bd.woff2'
import objektivMk1LtWoff from '../../components/assets/fonts/ObjektivMk1_W_Lt.woff'
import objektivMk1LtWoff2 from '../../components/assets/fonts/ObjektivMk1_W_Lt.woff2'
import objektivMk1MdWoff from '../../components/assets/fonts/ObjektivMk1_W_Md.woff'
import objektivMk1MdWoff2 from '../../components/assets/fonts/ObjektivMk1_W_Md.woff2'
import objektivMk1RgWoff from '../../components/assets/fonts/ObjektivMk1_W_Rg.woff'
import objektivMk1RgWoff2 from '../../components/assets/fonts/ObjektivMk1_W_Rg.woff2'
import objektivMk1ThWoff from '../../components/assets/fonts/ObjektivMk1_W_Th.woff'
import objektivMk1ThWoff2 from '../../components/assets/fonts/ObjektivMk1_W_Th.woff2'

interface FontStyle {
  woff: string
  woff2: string
  family: string
  weight: number
  style?: 'italic' | 'normal'
}

export const objektivMk1FontFamily = 'Objektiv Mk1'

const generateFontFace = ({
  woff,
  woff2,
  family,
  weight,
  style = 'normal',
}: FontStyle) => `
  @font-face {
    font-display: fallback;
    font-style: ${style};
    font-weight: ${weight};
    font-family: '${family}';
    src: url(${woff}) format('woff'), url(${woff2}) format('woff2');
  }
`

// Objektiv

export const objektivFontFaceTh = generateFontFace({
  weight: 250,
  family: objektivMk1FontFamily,
  woff: objektivMk1ThWoff,
  woff2: objektivMk1ThWoff2,
})

export const objektivFontFaceLt = generateFontFace({
  weight: 300,
  family: objektivMk1FontFamily,
  woff: objektivMk1LtWoff,
  woff2: objektivMk1LtWoff2,
})

export const objektivFontFaceRg = generateFontFace({
  weight: 400,
  family: objektivMk1FontFamily,
  woff: objektivMk1RgWoff,
  woff2: objektivMk1RgWoff2,
})

export const objektivFontFaceMd = generateFontFace({
  weight: 500,
  family: objektivMk1FontFamily,
  woff: objektivMk1MdWoff,
  woff2: objektivMk1MdWoff2,
})

export const objektivFontFaceBd = generateFontFace({
  weight: 700,
  family: objektivMk1FontFamily,
  woff: objektivMk1BdWoff,
  woff2: objektivMk1BdWoff2,
})
