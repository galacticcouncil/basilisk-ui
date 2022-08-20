import styled from "styled-components"
import { theme } from "theme"

export const StyledSlippage = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 8px;
  align-items: center;

  padding: 8px;
  margin: 32px 0 16px 0;

  background-color: rgba(${theme.rgbColors.black}, 0.25);
  border-radius: 12px;
`

export const StyledTradingPairContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  padding: 16px 32px;

  background-color: ${theme.colors.backgroundGray1000};
  border-radius: 12px;
`