var app = function() {

    var self = {};
    self.is_configured = false;

    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

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
        // This callback is called once Cordova has finished
        // its own initialization.
        console.log("The device is ready");
        $("#vue-div").show(); // This is jQuery.
        self.is_configured = true;
    };

    self.reset = function () {
        self.vue.board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,16];
        //give each element in the board a color
        //1 IS RED; 0 IS WHITE; 2 IS BLACK 
        self.vue.tile_color=[1,0,1,0,
                             0,1,0,1,
                             1,0,1,0,
                             0,1,0,2];
    };

    self.shuffle = function(i, j) {


         var row=0;
         var col=0;
         var empty = $('td:contains("16")');
         var empt_row = empty.parent().index();
         var empt_col = empty.index();
         //so you can get the coordinates of the empty cell

         if (Math.abs(empt_col - j) + Math.abs(empt_row - i) == 1) {
            //set values of the non empty value
            row = self.vue.board[4*i+j];
            col = self.vue.tile_color[4*i+j];
            //SWAPE
            //REPLACE THE VALUE THAT IS NOT NULL WITH VALUE THAT IS
            //CHANGE COLOR TOO
            Vue.set(self.vue.board,4*i+j,self.vue.board[4*empt_row+empt_col]);
            Vue.set(self.vue.tile_color,4*i+j,self.vue.tile_color[4*empt_row+empt_col]);

            Vue.set(self.vue.board, 4*empt_row+empt_col,row);
            Vue.set(self.vue.tile_color, 4*empt_row+empt_col,col);
         }

    };

    self.scramble = function() {
    //this while loop is supposed to check if
    //the 15 puzzle is solveable (SOMEWHERE HERE IT IS BROKEN)
    while(!self.vue.flag){
        var ele = self.vue.board.length;
        //this is the number of elements left to shuffle in
        //the 15 puzzle board.
        var rando;
        var the_num;
        var h;
         while (ele) {
            //gets the random number to swap with
           rando = Math.floor(Math.random() * ele--);
           // same logic in the shuffle
           // when you replace an element with another element
           //you need to change the color as well
           //the color is the one in the element before
           //j and j store the value and the color
           the_num = self.vue.board[ele];
           color_val = self.vue.tile_color[ele];
           Vue.set(self.vue.board,ele,self.vue.board[rando]);
           Vue.set(self.vue.tile_color,ele,self.vue.tile_color[rando]);
           Vue.set(self.vue.board,rando, the_num);
           Vue.set(self.vue.tile_color,rando, color_val);
         }

         //referenced http://stackoverflow.com/questions/34570344/check-if-15-puzzle-is-solvable
         //http://www.geeksforgeeks.org/check-instance-15-puzzle-solvable/ to see when it is solveable or not
        var parity = 0;
        var blank_loc;
        //so, we will check if parity is good or not.
        //called parity but actually inversions
            for (i = 0; i < self.vue.board.length-1; i++)
            {
                for (j = i + 1; j < self.vue.board.length; j++)
                {
                    if (self.vue.board[i] > self.vue.board[j] ) {
                        //this means not in order
                        parity++;
                    }
                }
            }

          //going through the array like a [4][4]
          //but it (astro)naught
          for (i = 3; i >= 0; i--){
                 for (j = 3; j >= 0; j--){
                     if (self.vue.board[4*i+j] == 16) {
                        blank_loc= 4 - i;
                    }
                 }
             }
         if ((blank_loc%2==0 && !(parity%2==0)) || (!(blank_loc%2==0) && (parity%2==0))){
             self.vue.flag=1;
             //set flag
             return self.vue.flag;
            } else {
                  self.vue.flag=0;
                  //set f;ag
                  return self.vue.flag;
                }
            }
            //while loop end
            
    };


    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            board: [],
            tile_color: [],
            flag: 0,
        },
        methods: {
            reset: self.reset,
            shuffle: self.shuffle,
            scramble: self.scramble,
        }

    });

    self.reset();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){
    APP = app();
    APP.initialize();
});