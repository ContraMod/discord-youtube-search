/*! Copyright (C) Adam Clarke 2018 */

import axios from 'axios'
import * as Discord from 'discord.js'
import * as querystring from 'querystring'
import { googleToken, discordToken, ownerID, channelID } from './config'

// options used in the api GET request string
const options = {
    part: 'id',
    order: 'date',
    safeSearch: 'none',
    type: 'video'
}

const client = new Discord.Client()
var baseUrl = appendToUrl('https://www.googleapis.com/youtube/v3/search?', options)

function appendToUrl(original: string, append: any) {
    return querystring.stringify(Object.assign(querystring.parse(original), append))
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

async function run(channel: Discord.TextChannel) {
    var text = ''
    var maxIterationCount = 100

    var lastMessage = (await channel.fetchMessages({limit: 1})).last()
    if (lastMessage === undefined) {
        var now = new Date()
        channel.send(now.toISOString())
        return
    }
    var lastDate = new Date(lastMessage.cleanContent)
    var baseUrl1: string

    if (!isNaN(lastDate.getTime())) {
        baseUrl1 = `${baseUrl}&publishedAfter=${lastDate.toISOString()}`
        console.log(lastDate)
    }

    async function fetch(nextPageToken?: string) {
        if (maxIterationCount-- <= 0) return
        console.log(maxIterationCount)
        var url = `${baseUrl1}&q=GCSE+results&key=${googleToken}`
        if (nextPageToken !== undefined) url += `&pageToken=${nextPageToken}`
        try {
            var {data} = await axios.get(url)
            //channel.send(`\`\`\`json\n${JSON.stringify(data, null, 2)}\`\`\``)
        } catch (e) {
            if (e.response) channel.send('`Youtube Error`:\n```json\n'+ JSON.stringify(e.response.data, null, 2) + '\n```')
            else console.error(e)
            return
        }

        for (const item of data.items) {
            text += `https://youtu.be/${item.id.videoId}\n`
        }
        if (data.nextPageToken) {
            await fetch(data.nextPageToken)
        } else {
            console.log('no more', data.items.length)
            return
        }
    }
    await fetch()

    if (text !== '') {
        channel.send(text)
    }
    var now = new Date()
    channel.send(now.toISOString())
}

client.on('message', async (msg: Discord.Message) => {
    if (msg.author.id !== ownerID) return
    if (msg.channel.id !== channelID) return
    if (msg.cleanContent !== '?yt') return
    if (msg.channel instanceof Discord.TextChannel) {
        await msg.delete()
        await run(msg.channel)
    }
})

const interval = 5*60*1000

setInterval(async () => {
    console.log('interval')
    var channel = client.channels.get('481929200048275456') as Discord.TextChannel
    await run(channel)
}, interval)

client.login(discordToken)
