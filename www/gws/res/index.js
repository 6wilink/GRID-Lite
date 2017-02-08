// 6Harmonics
// 2017.01.03

// check login form before submit
$('#form-login').submit(function() {
	var user = $('#username').val();
	var pass = $('#password').val()

	if (user.length < 5 || pass.length < 5) {
		console.log('> check input > ', user, pass);
		$('#txt-tips').text('Login failed. Try again.').addClass('error').show();
		return false;
	}
});

$(document).on('contextmenu', function() {
  return false;
});
