import { format, Locale } from "date-fns"
import { enUS } from "date-fns/locale"
import { z } from "zod"
import { BigNumberLikeType, normalizeBigNumber } from "./balance"
import BigNumber from "bignumber.js"
import { BN_10 } from "./constants"
import { Maybe } from "utils/helpers"
import { decodeAddress, encodeAddress } from "@polkadot/util-crypto"

export const formatNum = (
  number?: number | string,
  options?: Intl.NumberFormatOptions,
  locales?: string | string[],
): string | null => {
  if (number === undefined) return null

  try {
    const n = typeof number === "number" ? number : parseFloat(number)

    return new Intl.NumberFormat(locales, options).format(Math.ceil(n))
  } catch (err) {
    return null
  }
}

export const getFormatSeparators = (locales: string | string[] | undefined) => {
  const parts = new Intl.NumberFormat(locales).formatToParts(1000.1)
  const group = parts.find((i) => i.type === "group")?.value
  const decimal = parts.find((i) => i.type === "decimal")?.value
  return { group, decimal }
}

export const formatDate = (
  date: Date,
  formatting: string,
  locale?: Locale,
): string => {
  return format(date, formatting, { locale: locale || enUS })
}

export const formatRelativeTime = (
  sourceDate: Date,
  targetDate: Date,
  locales?: string | string[],
) => {
  const units = {
    year: 24 * 60 * 60 * 1000 * 365,
    month: (24 * 60 * 60 * 1000 * 365) / 12,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000,
  } as const

  const formatter = new Intl.RelativeTimeFormat(locales, { numeric: "auto" })
  const elapsed = sourceDate.valueOf() - targetDate.valueOf()

  for (const key in units) {
    const unit = key as keyof typeof units
    if (Math.abs(elapsed) > units[unit] || unit === "second") {
      return formatter.format(Math.round(elapsed / units[unit]), unit)
    }
  }

  return null
}

export const BigNumberFormatOptionsSchema = z
  .object({
    fixedPointScale: z
      .union([
        z.number(),
        z.string(),
        z.object({ toString: z.unknown() }).passthrough(),
      ])
      .optional(),
    decimalPlaces: z
      .union([
        z.number(),
        z.string(),
        z.object({ toString: z.unknown() }).passthrough(),
      ])
      .optional(),
    zeroIntDecimalPlacesCap: z
      .union([
        z.number(),
        z.string(),
        z.object({ toString: z.unknown() }).passthrough(),
      ])
      .optional(),
    numberPrefix: z.string().optional(),
    numberSuffix: z.string().optional(),
    type: z
      .union([z.literal("dollar"), z.literal("token"), z.literal("percentage")])
      .default("token")
      .optional(),
  })
  .refine((data) => Object.keys(data).length >= 1)

export type BalanceFormatOptions = z.infer<typeof BigNumberFormatOptionsSchema>

/**
 * TODO: write tests
 *
 * https://www.notion.so/Number-formatting-e26c4fa5c3564773a57711dfd854e28c
 *
 * Percentage:
 * - Display only 2 decimals, by cutting them not rounding
 * - If the integer number is 0 display 2 decimals
 * - If the percentage number is bigger than 99.99% (2 digits) don’t show any decimals
 * - Last integer unit is separated from decimals with a DOT symbol (.)
 *
 * Examples:
 *
 * - 12.345%     =>     12.34%
 * - 0.345%      =>      0.34%
 * - 99.991%     =>       100%
 *
 *
 * Dollar value:
 * - Display only 2 decimals, by cutting them not rounding
 * - Separate integers numbers with a space in group of 3 digits
 * - Show at least two decimal places
 * - If dollar value equals ZERO, only display, 0, without decimals
 * - If dollar value is less than 1.00 show the first significant digit
 * - If dollar value is higher than 999 dont show decimals
 *
 *  Examples:
 *
 * - 984.3498765   =>    984.34
 * - 1000          =>     1 000
 * - 0.009         =>         0
 * - 0.1           =>      0.10
 * - 999           =>     1 000
 *
 *
 * Token value:
 * - If integer value is higher than 999.9999 show only 2 decimals
 * - If the integer number is equal or less than 0 display a maximum of 6  decimals, by cutting them not rounding
 * - If token value equals ZERO, only display, 0, without decimals
 * - If the final digit of the amount is 0 decimal it should be round it up
 * - If token balance is higher than 99 999.99 don’t show decimals
 * - If token balance is higher than 9 999.9999 only show 2 decimals
 *
 * Examples:
 *
 * - 1 234.56789    =>     1 234.56
 * - 0.034556722    =>     0.034556
 * - 234.56700      =>      234.567
 * - 99 999.99      =>      100 000
 * - 9 999.9999     =>    10 000.99
 *
 */
export function formatBigNumber(
  value: Maybe<BigNumberLikeType>,
  options?: Maybe<z.infer<typeof BigNumberFormatOptionsSchema>>,
  locale?: string | string[],
) {
  BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN })

  if (value == null) return null
  let num = normalizeBigNumber(value)
  if (num.isNaN()) return "-"

  const localeOptions = getFormatSeparators(locale)
  const fmtConfig = {
    prefix: options?.numberPrefix ?? "",
    suffix: options?.numberSuffix ?? "",
    decimalSeparator: localeOptions.decimal ?? ".",
    groupSeparator: String.fromCharCode(160), // non-breaking space
    groupSize: 3,
  }

  if (options?.fixedPointScale != null) {
    num = num.div(BN_10.pow(Number(options.fixedPointScale)))
  }

  /*
    If any type value equals ZERO, only display, 0, without decimals
  */
  if (num.eq(0)) return BigNumber(0).toFormat(fmtConfig)

  /*
    If dollar value is less than 1.00 show the first significant digit
  */
  if (options?.type === "dollar" && num.abs().lt(1)) {
    const floatStr = num.toFixed().split(".")[1]

    let zeroesCount = 0
    for (let i = 0; i < floatStr.length; ++i) {
      if (floatStr[i] === "0") zeroesCount += 1
      else break
    }

    return num.toFormat(
      Math.max(2, zeroesCount + 1),
      BigNumber.ROUND_HALF_UP,
      fmtConfig,
    )
  }

  /* If dollar value is higher than 999 dont show decimals */
  if (options?.type === "dollar" && num.gt(999)) {
    return num.toFormat(0, fmtConfig)
  }

  if (
    options?.type === "percentage" &&
    options.decimalPlaces === "0" &&
    num.gt(1)
  ) {
    return num.toFormat(0, BigNumber.ROUND_HALF_UP, fmtConfig)
  }

  /* If the percentage number is bigger than 99.99% (2 digits) don’t show any decimals */
  if (options?.type === "percentage" && num.gt(99.99)) {
    return num.toFormat(0, BigNumber.ROUND_HALF_UP, fmtConfig)
  }

  /* Display only 2 decimals, by cutting them not rounding */
  if (options?.type !== "token") {
    return num.decimalPlaces(2).toFormat(fmtConfig)
  }

  /*If token balance is higher than 99 999.99 don’t show decimals */
  if (num.gt(99999.9999)) {
    return num.toFormat(0, fmtConfig)
  }

  /*If integer value is higher than 999.9999 show only 2 decimals. */
  if (num.gt(999.9999)) {
    return num.decimalPlaces(2).toFormat(fmtConfig)
  }

  /* If the integer number is equal or less than 0 display a maximum of 6 decimals, by cutting them not rounding */
  /* If the final digit of the amount is 0 decimal it should be round it up. */
  if (num.lt(1)) {
    return num.decimalPlaces(6).toFormat(fmtConfig)
  }

  return num.decimalPlaces(4).toFormat(fmtConfig)
}

export function shortenAccountAddress(address: string, length = 6) {
  return `${address.substring(0, length)}...${address.substring(
    address.length - length,
  )}`
}

export function safeConvertAddressSS58(
  address: Maybe<string>,
  ss58prefix: number,
) {
  try {
    return encodeAddress(decodeAddress(address), ss58prefix)
  } catch {
    return null
  }
}

/**
 * Format asset value by 3 digits
 */
export const formatAssetValue = (value: string) => {
  if (value == null) return ""
  let parts = value.toString().split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return parts.join(".")
}

export const isBsxAddress = (address: string) => address[0] === "b"
