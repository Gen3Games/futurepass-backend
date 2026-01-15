import { GlobalStyles as MuiGlobalStyles, css } from '@mui/material'

/**
 * Global base styles
 */
const GlobalStyles = () => (
  <MuiGlobalStyles
    styles={css`
      html {
        box-sizing: border-box;
        height: 100%;
      }

      body {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      *,
      *:before,
      *:after {
        box-sizing: inherit;
      }

      img {
        max-width: 100%;
      }

      fieldset {
        margin: 0;
        padding: 0;
        border: 0;
      }

      ul {
        margin: 0;
        padding: 0;
      }

      /* clears the 'X' from Internet Explorer */
      input[type='search']::-ms-clear {
        display: none;
        width: 0;
        height: 0;
      }
      input[type='search']::-ms-reveal {
        display: none;
        width: 0;
        height: 0;
      }

      /* clears the 'X' from Chrome */
      input[type='search']::-webkit-search-decoration,
      input[type='search']::-webkit-search-cancel-button,
      input[type='search']::-webkit-search-results-button,
      input[type='search']::-webkit-search-results-decoration {
        display: none;
      }

      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus textarea:-webkit-autofill,
      textarea:-webkit-autofill:hover textarea:-webkit-autofill:focus,
      select:-webkit-autofill,
      select:-webkit-autofill:hover,
      select:-webkit-autofill:focus {
        box-shadow: 0 0 0px 1000px white inset;
        transition: background-color 5000s ease-in-out 0s;
      }
      /* Chrome, Safari, Edge, Opera */
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      /* Firefox */
      input[type='number'] {
        -moz-appearance: textfield;
      }

      // TODO: use self contain font & css is ideal,
      // but current Next.js serve has issue when decode the hosting icon font
      // use Google cloud version in short term
      // import 'material-symbols/outlined.css'
      /* woff2 is coming from this dynamic CSS */
      /* https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,100..700,0..1,200 */
      @font-face {
        font-family: 'Material Symbols Outlined';
        font-style: normal;
        font-weight: 400;
        font-display: block;
        src: url(https://fonts.gstatic.com/s/materialsymbolsoutlined/v92/kJESBvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzB_guZ5QyRzawHcu1WwbppMw.woff2)
          format('woff2');
      }
      .material-symbols-outlined {
        font-family: 'Material Symbols Outlined';
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
      }
    `}
  />
)

export default GlobalStyles
