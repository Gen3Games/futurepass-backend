import { css, keyframes, styled } from '@mui/material'

const pulsIn = keyframes`
  0% {
    box-shadow: inset 0 0 0 1rem #fff;
    opacity: 1;
  }

  50%,
  100% {
    box-shadow: inset 0 0 0 0 #fff;
    opacity: 0;
  }
`

const pulsOut = keyframes`
  0%,
  50% {
    box-shadow: 0 0 0 0 #fff;
    opacity: 0;
  }

  100% {
    box-shadow: 0 0 0 1rem #fff;
    opacity: 1;
  }
`

const StyledLoader = styled('div')(
  () => css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 89px;
    max-width: 89px;
    margin-top: 23px;
    margin-bottom: 40px;
    transform: rotate3d(21, 5, 13, 93deg);

    &::before,
    &::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      animation: ${pulsOut} 1.8s ease-in-out infinite;
    }

    &::before {
      width: 100%;
      padding-bottom: 100%;
      box-shadow: inset 0 0 0 1rem #fff;
      animation-name: ${pulsIn};
    }

    &::after {
      width: calc(100% - 2rem);
      padding-bottom: calc(100% - 2rem);
      box-shadow: 0 0 0 0 #fff;
    }
  `
)

export const Loader: React.FC = () => {
  return <StyledLoader />
}

export default Loader
