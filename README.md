simple-counter - a simple http hits & hosts counter
===================================================

It's written in JavaScript for Node.js using Redis

## Usage methods
### 1x1 transparent GIF image
	<img src="http://counter.host:port/counter.gif"/>
or
	<img src="http://counter.host:port/counter.gif?id=counter_id"/>


### empty js-file
	<script type="text/javascript" src="http://counter.host:port/counter.js[?id=counter_id]"></script>

### crossdomain ajax
using jQuery

	function count(id) {
		$.ajax({
			dataType: 'jsonp',
			data: {id: id},
			jsonp: 'jsonp_callback',
			url: 'http://counter.host:port/counter.js'
		});
	}
	
	//for example let's count keypressed event
	$('body').keypress(function () {
		count('keypressed');
	});

### redirect links
	<a href="http://counter.host:port/link?to=http://google.com&id=external_link">google</a>

or dynamic:
using jQuery
	<script>
		$('a.external').click(function() {
			if (!$(this).data('url-changed')) {
				 $(this).attr('href', 'http://counter.host:port/link?id=external_link&to=' + $(this).attr('href'));
				 $(this).data('url-changed', true);
			}
		});
	</script>
	
	<a href="http://google.com" class="external">google</a>
	<a href="http://yandex.ru" class="external">yandex</a>