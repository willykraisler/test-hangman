
/*
 * Matrix Length x max currency
 *
 */
var jWords = {};
var failAttemps = [];
var succesAttemps = [];

//To convert to json
var processLine = function(line){
    return {
        "word" : line,
        "size" : line.length
    }
};

//Sort by length
var sortWords = function (a, b) {
    return a.size - b.size;
};


//sort out by length
var groupByLen = function (jWords){
    return jWords.reduce(function(a, b){
        var x = a[b.size];
        if(!x){
            x = [];
        }
        x.push(b.word);
        a[b.size] = x;
        return a
    }, {});
};

var inc = function (k,y) {
    var x = k[y];
    if(!x){
        x = 0;
    }
    x=x+1;
    k[y] = x;
    return k;
};

var calNumCurrency  = function(grouped){
    return  Object.keys(grouped).reduce(
        function(a, b){
            a[b] = grouped[b].reduce(
                function(z, t){
                    return t.split("").reduce(inc, z)},{});
            return a}, {});
};

var priorities = function(letters){
    return  Object.keys(letters).sort(function(a, b){
        return letters[b] -letters[a];
    });
};

//To sleep by mil sec because the Game has to load first.
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var guessWord = function (sorted, letFiltered){

    var regex;
    var failed = [];

    do {
        //special case
        if(sorted.length == 0)
            break;

        result = Game.guess(sorted[0]);

        //success
        if(result == true) {
            succesAttemps.push({"Match": sorted[0], "Word": Game.word()});
            break;
        }
        else if(typeof(result) == "string"){
            succesAttemps.push({"Match": sorted[0], "Word": Game.word()});
        }
        //next priority
        else if (result == false) {
            failed.push(sorted[0]);
            failAttemps.push({"notMatch": sorted[0], "Word": Game.word()});
        }
        //fail to guess
        else if(result == -2){
            break;
        }

        letFiltered.push(sorted[0]);

        adv = Game.word().split("").map(function(l){ return l == "*" ? "." : l;}).join("");
        regex = new RegExp(adv);
        sorted = priorities(groupByLen(jWords)[Game.word().length].filter(
            function(word){
                return word.match(regex) != null;
            }).filter(function(e){
                var p = failed.join("|");
                return e.match(new RegExp(p)) == null || p === "";
        }).reduce(
            function(z, t){
                return t.split("").reduce(inc, z)},{})).filter(function (letter) {
            return   (letFiltered.find(function (l) {
                    return l == letter;
                })) == null;
        })
    } while (true);


};

$(document).ready(function(){
    $.getScript("./game.built.js", function(){
        sleep(90000);
        //Init game
        Game.start();
        $.get("./words.txt", function(body){
            Game.start();
            //Put the dictionary in a big vector to change to json structure
            jWords = body.split("\n").map(processLine).sort(sortWords);
            //Calculate number of currency of words by each word's length after sort out by length
            window.grouped = calNumCurrency(groupByLen(jWords));
            wordGuess = Game.word();
            var sorted = priorities(grouped[wordGuess.length]);
            var i= 0;
            for (i=0; i<51; i++){
                var letFiltered = [];
                guessWord(sorted, letFiltered);
                sorted = priorities(grouped[wordGuess.length]);
                Game.next();
            }
            Game.result();
        });

    });
});



