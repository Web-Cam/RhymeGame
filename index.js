/*
	Template/ Example code: Benjamin Snoha /
	Revision : Web-Cam
	Title: Rhyme Gen
*/

'use strict';
var Alexa = require("alexa-sdk");
var request = require('request');
var APP_ID = 'amzn1.ask.skill.9e9acde3-0a41-4c7e-a9b2-aea5730bbbc8';

var languageStrings = {
    "en": {
        "translation": {
            "SKILL_NAME": "Rhyme Generator",
            "HELP_MESSAGE": "If you say any word, I will rhyme it, or, you can say exit, but why would you... What can I help you with?",
            "HELP_REPROMPT": "What can I help you with?",
            "STOP_MESSAGE": "Goodbye!"
        }
    }
};


exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function() {
        this.emit(':ask', "Welcome to Rhyme Game. Here are the rules, you say a word and I will find a rhyme. If you cant think of a rhyme or respond in 5 seconds you lose!, Now begin!");
        this.emit('GetNewWordIntent');
    },
	'EndGameUser': function() {
        this.emit(':tell', "I win! Better luck next time"); // Pulled ending words instead of calling unhandled, now call this instead.. Put call words in utterances
    },
    'GetNewWordIntent': function() {
        var seconds = 5;
        var wordInput = this.event.request.intent.slots.customWord.value;

        if (wordInput == null || wordInput === "undefined" || wordInput == '') { //Alexa doesnt understand the word, so User loses.
            this.emit('Unhandled'); //send to unhandled handler
        } else {
            // Create speech output
            getNextWord(wordInput, (speechOutput) => {
                if (speechOutput == '') {
                    this.emit('Unhandled');
                } else {
                    //this.emit(':tellWithCard', speechOutput, this.t("SKILL_NAME"), speechOutput);
                    this.emit(':ask', speechOutput );
                    // Start the five-second timer
                    var timer = setInterval(function(){
                        seconds--;
                        if (seconds <= 0) {
                            clearInterval(timer);
                            //this.emit(':tell', ' You ran out of time I win!'); //Timers not supported.. 
				//Great https://forums.developer.amazon.com/questions/53138/we-cant-create-timers-from-within-a-skill-do-we-ha.html
                        }
                    }, 1000);
                }
            });
        }
    },
    'AMAZON.HelpIntent': function() {
        var speechOutput = this.t("HELP_MESSAGE");
        var reprompt = this.t("HELP_REPROMPT");
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        //If the users sentence really made no sense at all, then just choose a random word to finish with.
        getNextWord("yellow", (speechOutput) => {
            if (speechOutput == '') {
                this.emit('Unhandled');
            } else {
                this.emit(':tell', ' There are no rhymes for that word ....You Lose I win .... Try Again? ');
            }
        });
    }
};

//Gets the rhyme for a single word
function getNextWord(contextWord, _callback) {
    var options = {
        url: 'https://api.datamuse.com/words?rel_rhy=' + contextWord + '&lc=' + contextWord + '&max=15' // if no max is set, it tends to return off topic words like boat rhymes with right to vote.
    };

    request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            //Get the info
            var info = JSON.parse(body);
            var potentialWord = [];

            //Search it to make sure the syllable count is the same
            if (info) {
                for (var i = 0; i < info.length; i++) {
                    //We found a rhyme, add to potential's array
                    potentialWord.push(info[i].word);
                }

                //Return random one from list of potential rhymes
                if (_callback) {
                    var randIndex = Math.floor(Math.random() * (potentialWord.length - 1));
                    if (potentialWord[randIndex]) {
                        return _callback(potentialWord[randIndex]);
                    }
                }
            }
        } else {
            console.log("Error making request: " + error);
        }

        if (_callback) {
            return _callback('');
        }
    });
}
