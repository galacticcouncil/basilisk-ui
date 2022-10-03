import styled from "styled-components"
import { Button } from "../Button/Button"
import { theme } from "../../theme"
import { ReactComponent as ChevronDown } from "../../assets/icons/ChevronDown.svg"

export const SSelectOptionsWrapper = styled.div`
  position: absolute;
  background: ${theme.colors.backgroundGray1000};
  min-width: 100%;
  margin-top: 5px;
  border-radius: 5px;
  z-index: 100;
`

export const SSelectWrapper = styled.div`
  position: relative;
`

export const SChevron = styled(ChevronDown)<{
  direction?: "down" | "up"
}>`
  transform: ${({ direction = "down" }) =>
    `rotate(${direction === "up" ? "-180deg" : "0deg"})`};
  transition: transform 0.2s ease;
`

export const SSelectButton = styled(Button)<{
  isOpened?: boolean
}>`
  display: flex;
  align-items: center;
  border-radius: 10px;
  text-transform: none;
  padding: 5px;
  background: ${({ isOpened }) =>
    isOpened ? theme.colors.backgroundGray900 : "transparent"};

  :hover {
    background: rgba(${theme.rgbColors.white}, 0.15);
  }
`
