fs.ques = (function(){

	var quiz, player, lang;
	var currId, bypass = new Array();

	var sortedQuiz	= new Array(),
		storage		= new Array();

	var pass = false;

	var lock = new Array();

	return {

		getItem: function(k)	{ return fs.storage.getItem('quiz-' + k);	},
		setItem: function(k, v)	{ fs.storage.setItem('quiz-' + k, v);		},
		removeRecord: function(){
			$.each(sortedQuiz, function( k, v ) { fs.storage.removeItem('quiz-' + parseInt(v.mapId, 10)); });
		},

		init : function( p, q, l ){

			quiz = q; player = p; lang = l;
			if ( quiz.length == 0 ) return;

			if ( fs.video.type() != 'html5' ) {

				if ( !fs.video.isSupport('html5') ) {
					alert( lang.quizNoSupFlashPS );
					fs.video.forcePlayerType( 'html5', lang.quizNeedHTML5PlayerPS );

					return;
				}

				fs.video.changePlayer('html5');

				return;
			}

			fs.video.forcePlayerType( 'html5', lang.quizNeedHTML5PlayerPS );

			this.sortQuiz();
			this.bindEvent();

			var cuePoint = new Array();

			var self = this;

			$.each(quiz, function( k, v ){
				cuePoint.push( {evt: 'video-quiz', time: parseInt(v.time, 10)/1000, args: { id : k }} );
			});

			fs.video.setBeforeSeek( $.proxy(this.checkQuiz, this) );
			fs.video.setCuePoint( cuePoint );
		},

		quizStatusCheck : function(){

			if ( $('[role="quiz"]').length > 0 ) return false;

			var exam = this.getQuiz( fs.video.getPos() );

			if ( exam ) {
				fs.video.pause();
				fs.video.setPos( parseInt(exam.time, 10) / 1000 );
				this.setupQuestion( exam );
			}

			return true;
		},


		sortQuiz : function(){

			var qt = new Array();
			for (var key in quiz) qt.push( quiz[key] );

			qt.sort(function(a, b) {return a.time - b.time});

			$.each(qt, function( k, v ) { sortedQuiz.push(v); });
		},

		bindEvent: function(){

			var self = this;

			fs.event.register('player.timeUpdate', function(){

				if ( $('[role="quiz"]').length > 0 ) fs.video.pause();

				var time = fs.video.getPos();

				$.each(quiz, function( k, v ){
					if ( Math.abs( time - (parseInt(v.time, 10) / 1000)) <= .25 ) return;
					lock[v.mapId] = false;
				});
			});

			fs.event.register('video-quiz', function(obj){

				if ( $('[role="quiz"]').length > 0 ) return;

				var mapId = obj.id;
				var exam = quiz[ mapId ];

				if ( lock[mapId] ) return;

				if ( exam ) {
					fs.video.pause();
					self.setupQuestion( exam );
				}
			});
		},

		checkQuiz : function( time ) {

			var ct = fs.video.getPos();

			if ( Math.abs(time-ct) < .5 ) return {status: false};

			if ( $('[role="quiz"]').length > 0 && time < ct ) {
				this.hideQuiz();
				return {status: true};
			}

			bypass = new Array();
			$.each(sortedQuiz, function( k, v ) {

				if ( (parseInt(v.time, 10) / 1000) >= time ) return;

				var config	= JSON.parse( v.config ),
					mapId	= parseInt(v.mapId, 10);

				if ( config.bypass != 'true' ) return;

				bypass.push(mapId);
			});

			var q = this.getQuiz( time );

			if ( !q ) return {status:true};

			var self = this;

			fs.event.registerOne('player.seekFinished', function(){
				if ( $('[role="quiz"]').length > 0 ) return;

				if ( q ) {
					if ( lock[q.mapId] ) return;
					fs.video.pause();
					self.setupQuestion( q );
				}
			});

			return  {status:false, pause:true, pos: parseInt(q.time, 10)/1000};
		},

		getQuiz : function( ct ){
			var q		= null,
				self	= this;

			$.each(sortedQuiz, function( k, v ) {

				var t = (parseInt(v.time, 10) / 1000);

				if ( t > ct ) return;

				var config	= JSON.parse( v.config ),
					mapId	= parseInt(v.mapId, 10);

				if ( config.bypass == 'true' && $.inArray(mapId, bypass) != -1 ) return;
				if ( self.getItem( mapId ) != 'true' ) {
					q = v;
					return false;
				}
			});

			return q;
		},

		setupQuestion : function( exam ){

			currId	= exam.mapId;

			lock[ currId ] = true;

			var id		= 'quiz-' + currId,
				ques	= fs.ques[ exam.type ];

			var question = $('<div>', {
				'id'	: id,
				'role'	: 'quiz',
				'class'	: 'quiz ' + exam.type,
				'css'	: {'display': 'none'},
				'html'	: ques.init( id, exam, lang, this.getItem(currId) )
			});

			$('#' + player).append( $('<div>', {'role' : 'quizMask', 'class' : 'quiz-mask'}) );
			$('#' + player).append( question );

			question.show('fast', function(){
				ques.setupEvent();
			});

			question.bind('touchmove', function(e){ e.stopPropagation(); });
		},

		minimize : function( id ){
			var question = $('#' + id);

			var max = $('<button>', {
				'class' : 'maxbtn btn btn-mini',
				'text'	: lang.quizResizer,
				'role'	: 'maximize'
			});

			$('#' + player).append( max );

			question.addClass('minimize');

			var self = this;
			max.click( function(){ self.maximize( id ); } );
		},

		maximize : function( id ){
			var question = $('#' + id);

			$('#' + player).find('[role="maximize"]').remove();

			question.removeClass('minimize');
		},

		hideQuiz : function(){
			currId = null;

			var question 	= $('[role="quiz"]'),
				self		= this;

			question.hide('fast', function() {
				$(this).remove();
				$('[role="quizMask"]').remove();
				$('[role="maximize"]').remove();
			} );
		},

		next : function(){

			this.setItem( currId, true );
			currId = null;

			var question	= $('[role="quiz"]'),
				self		= this;

			question.hide('fast', function() {
				$(this).remove();

				$('[role="quizMask"]').remove();

				fs.video.play();
			});
		}
	}
})();
