$('.hint').slideUp('fast', function() {
});

$('.show_hint').click(function() {
    $('.hint').slideToggle('slow', function() {
    });
    return false;
});

// convert the text area into a code editor
var editor = CodeMirror.fromTextArea(document.getElementById("code_console"), {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    theme: "ambiance",
    autofocus: true,
    mode: const_code_lang,
    extraKeys: {"Ctrl-Q": "toggleComment"}
});

editor.setSize("100%", "350");

// constant value for reset button
var const_text_reset = $("#initial_code").text(); 

// constant js code, specific for each problem
// will be added in the last line of the submitted code
// can be blank
// [MOVED to the templates]

$("button.reset_code").click(function(e) {
    editor.setValue(const_text_reset);
    return false;
});

// click event for submitting button
// form is not gonna be submitted
// but processed by ajax
$(".submit_code").click(function(e) {

    $("div.code_output_message").html("");
    $("div.code_output_div").removeClass("alert alert-success alert-error");
    $("div.code_output").html("");

    $('.code_output_div').fadeOut('fast', function() {
    });

    // get the submitted code
    var submitted_code = editor.getValue();

    var error = false;
    var output = "";
    var answer = "";
    var message = "Code anda benar.";
    var secret_message = "";

    if (const_code_lang === "javascript") {
        try {
            // console.log are not shown by the eval function
            // so we need to delete it
            var stripped_code = submitted_code.replace(/;/g, ";\n");
            stripped_code = stripped_code.replace(/console.log(.+)/g, "consolelog += $1; consolelog += '<br/>';");
            stripped_code = "var consolelog = '';" + stripped_code ;
            var count_consolelog = stripped_code.match(/consolelog/g);

            if (count_consolelog.length > 1) {
                stripped_code += '\nconsolelog;';
            }

            //console.log(stripped_code);
            var eval_result = eval(stripped_code);

            if ( typeof(eval_result) != "undefined" ) {
                answer =  eval_result;
                // console.log(answer);
                if (count_consolelog.length > 1) {
                    answer = answer.replace(/(^\<br\/\>)|(\<br\/\>$)/g, '');
                }
                output =  answer;
                // console.log(answer);
            } else {
            }

            if (const_eval_code.length) {
                var added_eval_code = stripped_code + "\n" + "var skipconsolelog=false;" + const_eval_code;
                //console.log(added_eval_code);
                added_eval_code = added_eval_code.replace(/prompt(.+)|alert(.+)|confirm(.+)/g, "$1");
                if (count_consolelog.length > 1) {
                    added_eval_code += '\nif (!skipconsolelog) {consolelog;}';
                }
                //console.log(added_eval_code);
                eval_result = eval(added_eval_code);
                answer =  eval_result;
                // console.log('eval coy');
                // console.log(answer);
                if (count_consolelog.length > 1 && typeof(answer) == 'string') {
                    answer = answer.replace(/(^\<br\/\>)|(\<br\/\>$)/g, '');
                }
                // console.log(answer);
            }

        } catch (e) {
            error = true;
            error_message = e.message.toLowerCase();
            message = "Code anda error dengan pesan:<br/>\"" + e.name+": "+error_message +"\"";
            message = message.replace(/is undefined|is not defined/g , 'belum dideklarasikan');
            message = message.replace(/missing ; before statement/g , 'antar baris tidak diakhiri dengan \<code\>\;\<\/code\>');
            message = message.replace(/missing variable name/g , 'kehilangan nama variabel');
            message = message.replace(/missing \( before condition/g , 'kehilangan \<code\>\(\<\/code\> sebelum kondisi');
            message = message.replace(/missing \( after condition/g , 'kehilangan \<code\>\)\<\/code\> setelah kondisi');
            message = message.replace(/unexpected token/g , 'muncul secara tiba-tiba:');
            message = message.replace(/unexpected end of input/g , 'Akhir dari code yang tak diduga');
            message = message.replace(/missing \( before formal parameters/g , 'Kehilangan \( sebelum parameter');
            message = message.replace(/missing \) after formal parameters/g , 'Kehilangan \) sebelum parameter');
            message = message.replace(/syntax error/g , 'Error di penulisan! Perhatikan setiap karakter di code anda');
        }
    } 

    var con_error;
    var correct;

    if (!error) {
        if (typeof(answer) == 'undefined'){
            answer = ' ';
        }

        var t = new Date();
        t = t.getTime();

        $.ajax({
            type: "GET",
            data: { a:answer, l:const_code_lang, c:submitted_code , t:t},
            url: "/periksa/" + task_id + "/",
            beforeSend : function(data) {
                con_error = false;
                correct = false;
                $("a, button").attr("disabled", true);
                $("div.code_output").html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div> </div>');
            },
            error : function(data) {
                con_error = true;
            },
            success : function(data) {
                data = jQuery.parseJSON(data);
                if (data.result) {
                    correct = true;
                    $(".next_btn").fadeOut();
                    $(".next_btn").attr('href',  data.next);
                    $(".next_btn").removeClass("disabled");
                    $(".next_btn").removeClass(" btn-inverse ");
                    $(".next_btn").addClass(" btn-warning ");
                    $('.next_btn').fadeIn('slow', function() {
                    });
                    $('#task_status').html('<i class="icon-ok"></i>');
                    $("#task_status").removeClass("label-important");
                    $("#task_status").addClass("label-success");
                    $("#task_status").attr('title',  "Berhasil!");
                } else {
                    message = "Silahkan coba sekali lagi. ";
                    if (secret_message.length) {
                        message += "<br/>" + secret_message;
                        secret_message = '';
                    } else if (data.message) {
                        message += "<br/>" + data.message;
                    } else {
                        if (data.error_found) {
                            message += "<br/>Tampaknya ada error di code anda.";
                            message += "<br/>Perhatikan output dari code anda dengan seksama.";
                            message += "<br/>Kesalahan karakter, urutan, atau nama sangatlah fatal.";
                        } else {
                            message += "<br/>Pastikan anda mengikuti instruksi di samping kiri.";
                            message += "<br/>Jika sudah 'mentok' coba tanyakan di forum diskusi.";
                        }
                    }
                }
                if (const_code_type == 'server_side') {
                    output = data.output;
                }
                try {
                    if (data.badge_title.length) { // LENCANA
                        var text = "";
                        var image_html = "";
                        for (var i = 0, l = data.badge_title.length; i < l; i ++) {
                            var v = data.badge_title[i];
                            var img = data.badge_image[i];
                            text += v;
                            image_html += '<img width="180px" height="180px" class="badge_img" src="/media/' + img +'">';
                            if ( i + 1 != data.badge_title.length) {
                                text += " & ";
                            }
                        }
                        text += ".";
                        $(".badge_title").text(text);
                        $(".badge_img_div").html(image_html);
                        $(".badge_url").attr("href", "/lencana/"+data.badge_url[0]);
                        $(".badge_div").removeClass("hidden");
                        window.objectToLike = "http://codesaya.com/lencana/"+data.badge_url[0];

                        // Additional JS functions here
                        window.fbAsyncInit = function() {
                            window.FB.init({
                                appId      : window.fbAppId, // App ID
                                status     : true,    // check login status
                                cookie     : true,    // enable cookies to allow the
                                // server to access the session
                                xfbml      : true,     // parse page for xfbml or html5
                                // social plugins like login button below
                                version        : 'v2.0',  // Specify an API version
                            });
                        }
                    }

                    // Load the SDK Asynchronously
                    (function(d, s, id){
                        var js, fjs = d.getElementsByTagName(s)[0];
                        if (d.getElementById(id)) {return;}
                        js = d.createElement(s); js.id = id;
                        js.src = "//connect.facebook.net/en_US/sdk.js";
                        fjs.parentNode.insertBefore(js, fjs);
                    }(document, 'script', 'facebook-jssdk'));

                    if (data.finished) {
                        if (data.finished == 'course') {
                            $(".finished_title").text("Seluruh Materi");
                        } else if (data.finished == 'chapter') {
                            $(".finished_title").text("Bab ini");
                        } else {
                            $(".finished_title").text("Subbab ini");
                        }
                        $(".finished_btn").attr('href',  data.finished_url);
                        $(".finished_div").removeClass("hidden");
                    }
                } catch (e) {

                }

            },
            complete : function(data) {
                $("a, button").removeAttr("disabled");
                if(con_error) {
                    message = "Koneksi Error. Coba lagi dalam beberapa detik.";
                    message += "<br/>Jika masih berlanjut, anda mengetikkan karakter yang tidak diijinkan oleh server.";
                    message += "<br/>Gunakan karakter yang ada di tutorial ini. Kalo perlu salin dan tempel.";
                    message += "<br/>Atau terlalu banyak mencetak karakter ke layar.";
                    message += "<br/>Tweet ke @CodeSaya jika ini masih berlanjut.";
                }

                display_error_submitted_code(output, message);

                // overide the class from display error if it is correct
                if (correct) {
                    $("div.code_output_div").removeClass("alert alert-success alert-error");
                    $("div.code_output_div").addClass("alert alert-success");
                    $("div.code_output_message").html(message);
                    $(".next_task").removeAttr("disabled");
                }

                // Move to the next task
                // if success

                //$(this).oneTime(5000, function() {
                //$("div.code_output").removeClass("alert alert-success alert-error");
                //$("div.code_output").html("");
                //});
            }
        });
    } else {
        display_error_submitted_code(output, message);
    }
    return false;
});

var display_error_submitted_code = function(output, message) {
    $("div.code_output_div").addClass("alert alert-error");
    $("div.code_output_message").html(message);
    $("div.code_output").html(output);
    $(".next_task").attr("disabled", true);
    $('.code_output_div').fadeIn('slow', function() {
    });
};

$('.code_output_div').fadeOut('fast', function() {
});

$('.code_output_div .close').click(function() {
    $('.code_output_div').fadeOut('slow', function() {
    });
    return false;
});
