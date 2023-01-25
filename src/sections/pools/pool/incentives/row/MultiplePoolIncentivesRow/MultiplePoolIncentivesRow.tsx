import { Text } from "components/Typography/Text/Text"
import { Separator } from "components/Separator/Separator"
import { FarmAssetIcon } from "./FarmAssetIcon"
import { AprFarm, getMinAndMaxAPR } from "utils/farms/apr"
import { useTranslation } from "react-i18next"
import { MultipleIcons } from "components/MultipleIcons/MultipleIcons"

type Props = {
  farms: AprFarm[]
}

export const MultiplePoolIncentivesRow = ({ farms }: Props) => {
  const { t } = useTranslation()

  return (
    <>
      <div sx={{ flex: "row", justify: "space-between" }}>
        <div sx={{ flex: "row" }}>
          <MultipleIcons
            icons={farms.map((farm) => ({
              icon: (
                <FarmAssetIcon
                  key={farm.assetId.toString()}
                  assetId={farm.assetId}
                />
              ),
            }))}
          />
        </div>
        {!!farms.length && (
          <Text color="primary200">
            {t("value.multiAPR", getMinAndMaxAPR(farms))}
          </Text>
        )}
      </div>
      <Separator sx={{ mt: 18 }} />
    </>
  )
}