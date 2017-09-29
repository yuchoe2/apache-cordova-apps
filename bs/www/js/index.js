var app = function() {

    var self = {};
    self.is_configured = false;

    var server_url = "https://luca-ucsc-teaching-backend.appspot.com/keystore/";
    var call_interval = 2000;

    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    self.my_identity = randomString(20);

    self.null_board = ["", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", ""];
    self.top_null = ["", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", ""];

    // Enumerates an array.
    var enumerate = function(v) {
        var k=0;
        v.map(function(e) {e._idx = k++;});
    };

    // Initializes an attribute of an array of objects.
    var set_array_attribute = function (v, attr, x) {
        v.map(function (e) {e[attr] = x;});
    };

    self.initialize = function () {
        document.addEventListener('deviceready', self.ondeviceready, false);
    };

    self.ondeviceready = function () {
        // This callback is called once Cordova has finished its own initialization.
        console.log("The device is ready");

        $("#vue-div").show();
        self.is_configured = true;
    };

    // This is the object that contains the information coming from the server.
    self.player_2 = null;
    self.player_1 = null;
    self.board_1 = null;
    self.board_2 = null;
    self.numoturn = 0;
    self.total_hits = 0; // win game by getting to 10 hits before opponent

    // This is the main control loop.
    function call_server() {
        console.log("Calling the server");
        if (self.vue.chosen_magic_word === null) {
            console.log("No magic word.");
            setTimeout(call_server, call_interval);
        } else {
            // We can do a server call.
            // Add a bit of random delay to avoid synchronizations.
            var extra_delay = Math.floor(Math.random() * 1000);
            $.ajax({
                dataType: 'json',
                url: server_url +'read',
                data: {key: self.vue.chosen_magic_word},
                success: self.process_server_data,
                complete: setTimeout(call_server, call_interval + extra_delay) // Here we go again.
            });
        }
    }

    // Main function for sending the state.
    self.send_state = function () {
        $.post(server_url + 'store',
            {
                key: self.vue.chosen_magic_word,
                val: JSON.stringify(
                    {
                        'player_2': self.player_2,
                        'player_1': self.player_1,
                        'board_2': self.board_2,
                        'board_1': self.board_1,
                        'numoturn': self.numoturn
                    }
                )
            }
        );
    };


    // Main place where we receive data and act on it.
    self.process_server_data = function (data) {
        // If data is null, we send our data.
        if (!data.result) {
            self.player_2 = self.my_identity;
            self.player_1 = null;
            self.vue.is_my_turn = true;
            self.vue.board = getBoard();
            self.board_2 = self.vue.board;
            self.board_1 = self.null_board;
            self.numoturn = 1;
            self.send_state();
        } else {
            // I technically don't need to assign this to self, but it helps debug the code.
            self.server_answer = JSON.parse(data.result);
            self.player_2 = self.server_answer.player_2;
            self.player_1 = self.server_answer.player_1;
            self.board_2 = self.server_answer.board_2;
            self.board_1 = self.server_answer.board_1;
            self.numoturn = self.server_answer.numoturn;



            if (self.player_2 === null || self.player_1 === null) {
                // Some player is missing. We cannot play yet.
                self.vue.is_my_turn = false;
                console.log("Not all players present.");
                if (self.player_1 === self.my_identity || self.player_2 === self.my_identity) {
                    // We are already present, nothing to do.
                    console.log("Waiting for other player to join");
                } else {
                    console.log("Signing up now.");
                    

                    if (self.player_2 === null) {
                        
                        self.player_2 = self.my_identity;
                        self.vue.board = getBoard();
                        self.board_2 = self.vue.board;
                        //as player 2, assign the boards to x
                        //initialize the board.
                        for(var i=0; i<64; i++){
                            Vue.set(self.vue.top_board, i, self.server_answer.board_1[i]);
                        }
                        self.send_state();
                        //sae with player 1
                    } else if (self.player_1 === null) {
                        self.player_1 = self.my_identity;
                        self.vue.board = getBoard();
                        self.board_1 = self.vue.board;
                        self.send_state();
                    } else {
                        //compare to server
                        //and if magic word is already used, then say that
                        //we need a new one -> see html
                        self.vue.need_new_magic_word = true;
                    }
                }
            } else {
                console.log("Both players are present");
                self.vue.poop = true;
                console.log(self.vue.poop);
                //self.poop == true;
                //poop is just checking if both have entered


                if (self.player_1 !== self.my_identity && self.player_2 !== self.my_identity) {
                    // Again, we are intruding in a game.
                    //
                    self.vue.need_new_magic_word = true;
                } else {
                    //update here
                    self.update_local_vars(self.server_answer);
                }

            }
        }
    };
    //here, we obtain the identnties of the players
    //and their respective boards.
    self.update_local_vars = function (server_answer) {
        if (server_answer.player_1 === self.my_identity) {
            self.vue.my_role = 'Player 1';
        } else if (server_answer.player_2 === self.my_identity) {
            self.vue.my_role = 'Player 2';
        } else {
            self.vue.my_role = ' ';
        }

        //for player 2, top board is player 1's board
        //and the board that they see, the one on the bottom, is board 2
        if(self.player_2 === self.my_identity){
            self.vue.top_board = self.board_1;
            self.vue.board = self.board_2;
             console.log("enemy-board: " + self.vue.top_board);
        }else if (self.player_1 === self.my_identity){
            self.vue.top_board = self.board_2;
            self.vue.board = self.board_1;
             console.log("enemy-board: " + self.vue.top_board);
        }

    };


    function whose_turn(numoturn) {
        //each click, numoturn, which is turn number, increments by one
        //increment by one, mod numoturn to see whose turn it is
        //player 2 is even
        //player 1 is even
        if(self.my_role === 'Player 2' && numoturn%2 === 0) {
            return 'Player 2';
        } else if (self.my_role === 'Player 1' && numoturn&2 !== 0){
            return 'Player 1';
        } else {
            return '';
        }

    }


    self.set_magic_word = function () {
        self.vue.chosen_magic_word = self.vue.magic_word;
        self.vue.need_new_magic_word = false;

        // Resets board and turn.
        self.vue.board = self.null_board;
        self.vue.is_my_turn = false;
        self.vue.my_role = "";
    };


    self.play = function (el) {
        // if(!self.vue.is_my_turn){
        //     console.log("NATCHO TURN")
        //     return;

        if(self.ShipCheck(el)){
            self.numoturn += 1;
            self.total_hits += 1;
            //make the numbrer neahtivre
            //subtract by huge number wow
            var newnum = self.vue.top_board[el] - 50;
            Vue.set(self.vue.top_board, el, newnum);
        }else if(!self.ShipCheck(el)){
            self.numoturn += 1;
            //check if hit tile is already hit
            if(self.vue.top_board[el] === 'W' || self.vue.top_board[el] < 0){
                
                return;
            }else if(self.vue.top_board[el] === '*'){
                Vue.set(self.vue.top_board, el, 'W');

            }


        }

        self.boardUpdate();
        self.send_state();
        self.endState();
        //okay so here, i was trying to do the turn switching by
        //calling the whose_turn function to switch between player 1 and 2 but
        //it didn't really work. :(
       // whose_turn(numoturn);
    };

    self.newGame = function(){
        //when players press new game,
        //the boards are reanitilizaed
        if(self.player_1===self.my_identity){
            self.vue.board_1 = self.null_board;
            self.vue.board_2 = self.top_null;
        }else{
            self.vue.board_1 = self.top_null;
            self.vue.board_2 = self.null_board;
        }
        //values down here are realitionzied too
        //total hits is for end game condition
        self.total_hits = 0;
        //numoturn is for getting whose turn it is but that doesn't work so...
        self.numoturn = 0;
        self.boardUpdate();
        self.send_state();
    };

    self.boardUpdate = function(){
        console.log("in update function");
        if(self.vue.my_role === 'Player 2'){
            //go through the board, and update it
            //for player 2
            for (var i=0; i<64; i++){
                if(self.vue.top_board[i] !== self.board_1[i]){
                    Vue.set(self.board_1, i, self.vue.top_board[i]);
                }
            }
        }else if (self.vue.my_role === 'Player 1'){
            //go through board and update for player 1
            for (var j=0; j<64; j++){
                if(self.vue.top_board[j] !== self.board_2[j]){
                    Vue.set(self.board_2, j, self.vue.top_board[j]);
                }
            }
        }
    };
    //checks if the ship gets hit
    self.ShipCheck = function(el) {
        //if board if greater than 0, that means the player hit hitsomething.
        if(self.vue.top_board[el] > 0) {
            return true;
            //check to see what the box says
            //if false, then that means the box is already hit orr
            //player missed
        } else if(self.vue.top_board[el] === '*' || self.vue.top_board[el] === 'W' ||
                self.vue.top_board[el] < 0){
            return false;
        }
    };

    //i tried...
    self.endState = function(){
        if(self.total_hits == 10){
            console.log("end game");
            return;
        }
        return;
    };

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            magic_word: "",
            chosen_magic_word: null,
            need_new_magic_word: false,
            my_role: "",
            board: self.null_board,
            top_board: self.top_null,
            board_2: self.null_board,
            board_1: self.null_board,
            is_other_present: false,
            is_my_turn: false,
            poop: false,
            total_hits: self.total_hits
        },
        methods: {
            set_magic_word: self.set_magic_word,
            play: self.play,
            ShipCheck: self.ShipCheck,
            endState: self.endState,
            newGame: self.newGame

            // top_null: self.top_null(),
            // set_player_board: self.set_player_board()
        }

    });

    call_server();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){
    APP = app();
    APP.initialize();
});