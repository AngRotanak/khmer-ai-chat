export enum MessageChannel {
  COMMENT = 'comment',
  MESSENGER = 'messenger',
}

export type MessageChannelType = `${MessageChannel}`

export interface MessageChannelDetail {
  name: string
  icon: string
  description: string
}

export const MessageChannelDetails: Record<MessageChannelType, MessageChannelDetail> = {
  comment: {
    name: 'COMMENT',
    icon: 'i-heroicons:chat-bubble-left-right',
    description: 'This will reply directly to a Facebook comment.'
  },
  messenger: {
    name: 'MESSANGER',
    icon: 'i-mingcute:messenger-line',
    description: 'This will send a private message via Messenger.'
  },
}


export function getMessageChannelDetails(channel: MessageChannelType) {
  return MessageChannelDetails[channel]
}
