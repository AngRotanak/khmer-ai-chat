import React, { useEffect, useState } from 'react'
import type { WaitTrigger, Condition } from '~/modules/blocks/types/feature-block'
import type { FeatureBlock, EntryTrigger, PathItem, SmartWelcomeConfig} from '~/modules/blocks/types/feature-block'

type SmartWelcomePanelProps = {
  data: FeatureBlock
  path: PathItem | undefined
  updateData: (patch: Partial<FeatureBlock>) => void
}

export const SmartWelcomePanel: React.FC<SmartWelcomePanelProps> = ({
  data,
  path,
  updateData,
}) => {
const config = (data.config as SmartWelcomeConfig) || {
  inactivityHours: 24,
  defaultLang: 'en',
  personalizeName: false,
  campaignTag: 'default',
}


  return (
    <div className="space-y-4">
      {/* 🧱 Block-Level Configuration */}
      <div className="border border-dark-300 rounded-md p-3 space-y-3 bg-dark-800">
        <div className="text-xs font-semibold text-light-900/60 mb-2">
          👋 Welcome Block Configuration
        </div>

        {/* 🔖 Block Name */}
        <div className="flex flex-col gap-y-1">
          <label className="text-xs text-light-900/60 font-medium mb-1">Block Name</label>
          <input
            type="text"
            value={data.block_name || ''}
            onChange={e => updateData({ block_name: e.target.value })}
            placeholder="e.g. welcome_new_year"
            className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
            maxLength={40}
          />
          <p className="text-[10px] text-light-900/40">
            Use a unique name (e.g. <code>welcome_new_user</code>). Only one welcome block will be active at a time.
          </p>
        </div>

        {/* ⚡ Trigger Conditions */}
        <div className="flex flex-col gap-y-2">
          <label className="text-xs font-medium text-light-900/60">⚡ Trigger Conditions</label>
          <div className="flex items-center gap-x-2">
            <input
              type="number"
              value={config.inactivityHours || 24}
              onChange={e =>
                updateData({ config: { ...data.config, inactivityHours: Number(e.target.value) } })
              }
              className="h-8 w-20 rounded-md bg-dark-900 text-light-100 text-xs px-2 border border-dark-500"
            />
            <span className="text-xs">Inactive after hours</span>
          </div>
        </div>

        {/* 🌐 Default Language */}
        <div className="flex flex-col gap-y-1">
          <label className="text-xs text-light-900/60 font-medium mb-1">Default Language</label>
          <select
            value={config.defaultLang || 'en'}
            onChange={e => updateData({ config: { ...config, defaultLang: e.target.value } })}
            className="h-8 w-full rounded-md bg-dark-900 text-light-100 text-xs px-2 border border-dark-500"
          >
            <option value="en">English</option>
            <option value="km">Khmer</option>
          </select>
        </div>

        {/* 👤 Personalize with Name */}
        <div className="flex items-center gap-x-2">
          <input
            type="checkbox"
            checked={config.personalizeName || false}
            onChange={e =>
              updateData({ config: { ...data.config, personalizeName: e.target.checked } })
            }
          />
          <label className="text-xs text-light-100">Personalize with user’s first name</label>
        </div>

        {/* 🎉 Campaign Tag */}
        <div className="flex flex-col gap-y-1">
          <label className="text-xs text-light-900/60 font-medium mb-1">Campaign Tag</label>
          <input
            type="text"
            value={config.campaignTag || ''}
            onChange={e => updateData({ config: { ...data.config, campaignTag: e.target.value } })}
            placeholder="e.g. new_year, promo, default"
            className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
          />
        </div>
      </div>
    </div>
  )
}


export default SmartWelcomePanel
