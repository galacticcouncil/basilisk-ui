import styled from "@emotion/styled"
import { Trigger } from "@radix-ui/react-dropdown-menu"
import { Button } from "components/Button/Button"
import { theme } from "theme"

export const SContainer = styled.div`
  margin: auto 0;
`

export const STrigger = styled(Trigger)`
  all: unset;

  display: flex;
  align-items: center;
  gap: 10px;

  position: relative;
  overflow: hidden;

  padding: 16px 32px;

  background: ${theme.gradients.primaryGradient};
  border-radius: 9999px;

  font-weight: 700;
  font-size: 14px;
  line-height: 18px;
  color: ${theme.colors.backgroundGray800};
  text-transform: uppercase;

  cursor: pointer;

  :hover {
    &::after {
      content: "";
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      background: rgba(${theme.rgbColors.white}, 0.2);
    }
  }
  :active {
    &::after {
      background: rgba(${theme.rgbColors.black}, 0.2);
    }
  }

  &[data-state="open"] {
    background: linear-gradient(
        180deg,
        rgba(35, 56, 55, 0.3) 0%,
        rgba(0, 0, 0, 0) 100%
      ),
      linear-gradient(0deg, #16171c, #16171c),
      linear-gradient(359.21deg, #111320 -1.12%, #f6297c 77.53%, #fc3f8c 94.14%),
      #111320;
    color: ${theme.colors.primary400};
  }
`

export const SButton = styled(Button)`
  font-weight: 700;

  > span {
    gap: 4px;
  }
`

export const SContent = styled.div`
  padding: 32px;

  background: linear-gradient(
      180deg,
      rgba(35, 56, 55, 0.3) 0%,
      rgba(0, 0, 0, 0) 100%
    ),
    linear-gradient(0deg, #16171c, #16171c),
    linear-gradient(359.21deg, #111320 -1.12%, #f6297c 77.53%, #fc3f8c 94.14%),
    #111320;
  box-shadow: 0px 55px 49px -6px rgba(1, 2, 5, 0.65);
  border-radius: 20px;
`
