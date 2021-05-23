/*! Copyright (C) Adam Clarke 2018 */

import axios from 'axios'
import * as Discord from 'discord.js'
import * as querystring from 'querystring'
import { queryTerm, googleToken, discordToken, channelID } from './config'

// options used in the api GET request string
const options = {
    part: 'id',
    order: 'date',
    safeSearch: 'none',
    topicId: '/m/03hf_rm', // Game: Strategy
    type: 'video'
}

const client = new Discord.Client()
const baseUrl = appendToUrl('https://www.googleapis.com/youtube/v3/search?', options)

function appendToUrl(original: string, append: {[key: string]: string}) {
    return original + querystring.stringify(append)
}

async function run() {
    let text = ''
    let baseUrl1 = ''
    let maxIterationCount = 50

    const channel = client.channels.get(channelID) as Discord.TextChannel
    const lastMessage = (await channel.fetchMessages({limit: 1})).last()
    if (lastMessage !== undefined) {
        const lastDate = lastMessage.createdAt.toISOString()
        console.log(`${lastDate} Last Date`)
        baseUrl1 = `${baseUrl}&publishedAfter=${lastDate}`
    } else {
        console.log(`${(new Date).toISOString()} No lastMessage found in ${channelID}`)
        baseUrl1 = `${baseUrl}&publishedAfter=${(new Date).toISOString()}`
    }

    async function fetch(nextPageToken?: string) {
        let url = `${baseUrl1}&q=${queryTerm}&key=${googleToken}`

        if (maxIterationCount-- <= 0) return console.log(maxIterationCount)
        if (nextPageToken !== undefined) url += `&pageToken=${nextPageToken}`

        try {
            const {data} = await axios.get(url)
            for (const item of data.items) {
                text += `https://youtu.be/${item.id.videoId}\n`
            }
            if (data.nextPageToken) {
                await fetch(data.nextPageToken)
            } else {
                console.log(`${data.items.length} video items found for query: ${queryTerm}`)
                return
            }
        } catch (e) {
            if (e.response) console.error('`Youtube Error`:\n```json\n'+ JSON.stringify(e.response.data, null, 2) + '\n```')
            else console.error(e)
            return
        }
    }
    await fetch()

    if (text !== '') {
        console.log(`Fetched URLs: ${text}`)
        channel.send(text)
    }
    console.log(`${(new Date).toISOString()} Done`)
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

client.on('message', async msg => {
    if (msg.channel.id !== channelID) return
    if (msg.cleanContent !== '?yt') return
    if (msg.channel instanceof Discord.TextChannel) {
        if (msg.deletable) await msg.delete()
        await run()
    }
})

client.on('messageReactionAdd', (reaction, user) => {
    if (!reaction.message.deletable) return
    if (reaction.message.author.id !== client.user.id) return
    switch (reaction.emoji.name) {
        case '❌':
        case '47_NukeBoom':
        case '26_GEN_Tao_Nuke':
        reaction.message.edit(`YouTube video flagged false positive by ${user.username}`)
    }
})

client.on('raw', (packet: any) => {
    if (!['MESSAGE_REACTION_ADD'].includes(packet.t)) return
    // There's no need to emit if the message is cached, because the event will fire anyway for that
    const channel = client.channels.get(channelID) as Discord.TextChannel
    if (channel.messages.has(packet.d.message_id)) return
    // Since we have confirmed the message is not cached, let's fetch it
    channel.fetchMessage(packet.d.message_id).then(message => {
        // Emojis can have identifiers of name:id format, so we have to account for that case as well
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name
        // This gives us the reaction we need to emit the event properly, in top of the message object
        const reaction = message.reactions.get(emoji)
        // Check which type of event it is before emitting
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id))
        }
    })
})

client.on('error', console.error)

//const interval = 5*60*1000 // minute(s)
const interval = 1*60*60*1000 // hour(s)

setInterval(async () => {
    console.log(`${(new Date).toISOString()} Hourly fetch`)
    await run()
}, interval)

client.login(discordToken)
