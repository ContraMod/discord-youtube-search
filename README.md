# Discord-youtube-search

```sh
git clone 'https://github.com/Adam-Clrk/discord-youtube-search'
cd discord-youtube-search
npm install						

cp config.sample.ts src/config.ts
editor config.ts    # edit config file

npm run build
npm start
```

## Api Keys
### Discord
https://discordapp.com/developers/applications/
1. create an application
2. add a bot user to the application
3. add the token into `config.ts`
4. add the bot to the server


### Google
https://console.developers.google.com/apis/dashboard
1. create a project
2. create credentials
3. restrict the credentials to the ip addresses needed and the youtube data api
4. copy the key into `config.ts`

## License
See `LICENCE`