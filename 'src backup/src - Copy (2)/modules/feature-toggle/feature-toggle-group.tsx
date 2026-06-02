import { FeatureToggle } from './feature-toggle'

type Props = {
  pageId: string
}

export function FeatureToggleGroup({ pageId }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-light-100">Features</h2>
      <FeatureToggle label="Messenger Preview" path={`pages/${pageId}/config/preview_enabled`} />
      <FeatureToggle label="Message Reply" path={`pages/${pageId}/features/auto_reply`} />
      <FeatureToggle label="Comment Reply" path={`pages/${pageId}/features/auto_reply_comments`} />
      <FeatureToggle label="Promo Mode" path={`pages/${pageId}/features/promo`} />
      <FeatureToggle label="Intro Message" path={`pages/${pageId}/features/intro`} />
    </div>
  )
}
