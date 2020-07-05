const fs = require('fs');
const Discord = require('discord.js')
const client = new Discord.Client();
const prefix = "&";

let rawdata = fs.readFileSync('config.json');
let object = JSON.parse(rawdata);
var channel_id = object['verification_channelID']
var guild_id = object['guild_ID']
var role_name = object['verification_role_name']
var muted_role = object['muted_role']
var server_invite = object['server_invite']
var token = object['bot_token']
var questions = object['questions']

var dict = {};

var encodingQuestions = []
questions.forEach(element => {
    encodingQuestions.push(element)
});

client.on('ready', function(){
    console.log("Logged in as " + client.user.tag);
})


client.on('guildMemberAdd', member => {
    var uname = member.user.username
    var disc = member.user.discriminator
    var memberID = member.user.id
    var rand = Math.random();
    rand *= encodingQuestions.length;
    rand = Math.floor(rand);
    var question = encodingQuestions[rand]
    dict[uname] = [Buffer.from(question, 'base64').toString('utf-8'), 3];
    const embed = new Discord.MessageEmbed()
        .setTitle(uname + "#" + disc)
        .setColor(0x1e90ff)
        .addField(name='Welcome', value='Welcome <@' + memberID + '> To The Server Please Decode This. Make sure you dont get it wrong 3 times! Answer using ``&answer {decoded message}`` in this DM', inline=false)
        .addField(name='Question', value=question, inline=false)
    member.send(embed)
    member.guild.channels.cache.get(channel_id).send("Welcome <@" + memberID + "> Please Check Your DM's to get access to the server!")
});

client.on('message', message => {
    var memberid = message.author.id;
    var memberuname = message.author.username;
    var messagecontent = message.content;
    var messageID = message.id;
    var disc = message.author.discriminator;
    if (!message.content.startsWith(prefix)) return;

    if (message.content.startsWith(prefix + 'answer') && message.channel.type === "dm"){
        var msg = message.toString().replace('&answer ', '')
        for (var key in dict){
            if (key == message.author.username){
                if (msg == dict[key][0]){
                    message.channel.send("You Passed The Test!")
                    var role = client.guilds.cache.get(guild_id).roles.cache.find(role => role.name === role_name)
                    client.guilds.cache.get(guild_id).members.cache.get(message.author.id).roles.add(role);
                    var memberID = message.author.id
                    client.channels.cache.get(channel_id).send("Congrats <@" + memberID + "> for passing the test!")
                    
                    delete dict[key];
                } else{
                    dict[key][1] = dict[key][1] - 1
                    if (dict[key][1] == 0){
                        memberID = message.author.id
                        message.channel.send("You Couldn't Pass The Test Therefore You've been kicked, You can rejoin using: " + server_invite)
                        client.channels.cache.get(channel_id).send("<@" + memberID + "> Couldn't pass the test and is now being kicked.")
                        setTimeout(function(){
                            client.guilds.cache.get(guild_id).members.cache.get(message.author.id).kick()
                        }, 5000)
                    } else{
                        message.channel.send("Try Again!")
                    }
                }
            }
        } 
    }else if(message.content.startsWith(prefix + "kick")){
        if (message.member.hasPermission("KICK_MEMBERS")){
            var fullCommand = message.toString().replace('&kick ', '')
            var user = fullCommand.split(' ')[0]
            var reason = fullCommand.split(' ')[1]
            user = user.replace('<@!', '')
            user = user.replace('>', '')
            client.guilds.cache.get(guild_id).members.cache.get(user).send("You Have Been Kicked From The Server, Reason: ``" + reason + "``, You Can Rejoin Using This Link! https://discord.gg/xbYcmms")
            setTimeout(function(){
                client.guilds.cache.get(guild_id).members.cache.get(user).kick()
            }, 1000)
        } else{
            message.reply('You dont have permission to kick people')
        }
    } else if(message.content.startsWith(prefix + "ban")){
        if (message.member.hasPermission("BAN_MEMBERS")){
            var fullCommand = message.toString().replace("&ban ", '')
            var user = fullCommand.split(' ')[0]
            var reason = fullCommand.split(' ')[1]
            user = user.replace('<@!', '')
            user = user.replace('>', '')
            client.guilds.cache.get(guild_id).members.cache.get(user).send("You Have Been Banned From The Server, Reason: ``" + reason + "``")
            setTimeout(function(){
                client.guilds.cache.get(guild_id).members.cache.get(user).ban()
            }, 1000)
        } else{
            message.reply('You dont have permission to ban people')
        }
    } else if(message.content.startsWith(prefix + "mute")){
        if (message.member.hasPermission("MUTE_MEMBERS")){
            var fullCommand = message.toString().replace("&mute ", '')
            var user = fullCommand.split(' ')[0]
            var amount = fullCommand.split(' ')[1]
            amount *= 60000
            user = user.replace('<@!', '')
            user = user.replace('>', '')
            var roleList = []
            client.guilds.cache.get(guild_id).members.cache.get(user).roles.cache.array().forEach(role => roleList.push(role.name))
            var index = roleList.indexOf('@everyone')
            roleList.pop(index)
            for (var index in roleList){
                var role = client.guilds.cache.get(guild_id).roles.cache.find(role => role.name === roleList[index])
                client.guilds.cache.get(guild_id).members.cache.get(user).roles.remove(role);
            }

            var role = client.guilds.cache.get(guild_id).roles.cache.find(role => role.name === muted_role)
            client.guilds.cache.get(guild_id).members.cache.get(user).roles.add(role);

            setTimeout(function (){
                for (var index in roleList){
                    var role = client.guilds.cache.get(guild_id).roles.cache.find(role => role.name === roleList[index])
                    client.guilds.cache.get(guild_id).members.cache.get(user).roles.add(role);

                    var role = client.guilds.cache.get(guild_id).roles.cache.find(role => role.name === muted_role)
                    client.guilds.cache.get(guild_id).members.cache.get(user).roles.remove(role);
                }
            }, parseInt(amount))
        } else{
            message.reply("You dont have permission to mute people!")
        }
    }
})
client.login(token);
