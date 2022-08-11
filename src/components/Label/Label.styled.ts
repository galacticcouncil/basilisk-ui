import styled from "styled-components/macro"
import { Label } from "@radix-ui/react-label"
import { theme } from "theme"
import {
  flex,
  margins,
  FlexProps,
  FontProps,
  MarginProps,
  fonts,
} from "common/styles"

export const StyledLabel = styled(Label)<{ error?: string } & FontProps>`
  font-size: 16px;
  line-height: 22px;
  color: ${p => (p.error ? theme.colors.error : theme.colors.neutralGray100)};
  text-transform: capitalize;
  ${fonts};
s
`

export const ErrorMessage = styled.p`
  color: ${theme.colors.error};
  font-size: 12px;
  line-height: 16px;
  margin-top: 2px;
  text-transform: capitalize;
`

export const LabelWrapper = styled.div<
  { $width?: number } & FlexProps & MarginProps
>`
  ${p => p.$width && `width: ${p.$width}px`};
  font-size: 0;

  input {
    width: ${p => (p.$width ? `${p.$width}px` : "300px")};
  }
  ${flex};
  ${margins};
`