$(document).ready(function(){function e(){$(".nav-toggle").click(function(){$(".nav").toggleClass("open")})}function s(){$('a[href^="#"]').click(function(e){var s=$($(this).attr("href"));s.length&&(e.preventDefault(),$("html, body").animate({scrollTop:s.offset().top-15},300)),$(".nav").toggleClass("open")})}function r(){$("#full-slide .prev, #full-slide .next").click(function(){var e=$(this),s=$(".banner").find(".active"),r=$(".banner").children().index(s),a=$(".banner").children().length;e.hasClass("next")?a-1>r?$(".active").removeClass("active").next().addClass("active"):$(".banner li").removeClass("active").first().addClass("active"):0===r?$(".banner li").removeClass("active").last().addClass("active"):$(".active").removeClass("active").prev().addClass("active")})}function a(){$("#three-slide .prev, #three-slide .next").click(function(){var e=$(this),s=$(".slider").find(".back"),r=$(".slider").children().index(s),a=$(".slider").find(".current"),l=$(".slider").children().index(a),n=$(".slider").find(".front"),t=$(".slider").children().index(n),d=$(".slider").children().length;$(".slider").addClass("swap"),setTimeout(function(){e.hasClass("next")?d-1>t&&d-1>l&&d-1>r?($(".back").removeClass("back").next().addClass("back"),$(".current").removeClass("current").next().addClass("current"),$(".front").removeClass("front").next().addClass("front")):t===d-1?($(".back").removeClass("back").next().addClass("back"),$(".current").removeClass("current").next().addClass("current"),$(".slider li").removeClass("front").first().addClass("front")):l===d-1?($(".back").removeClass("back").next().addClass("back"),$(".slider li").removeClass("current").first().addClass("current"),$(".front").removeClass("front").next().addClass("front")):($(".slider li").removeClass("back").first().addClass("back"),$(".current").removeClass("current").next().addClass("current"),$(".front").removeClass("front").next().addClass("front")):0!==r&&0!==l&&0!==t?($(".back").removeClass("back").prev().addClass("back"),$(".current").removeClass("current").prev().addClass("current"),$(".front").removeClass("front").prev().addClass("front")):0===r?($(".slider li").removeClass("back").last().addClass("back"),$(".current").removeClass("current").prev().addClass("current"),$(".front").removeClass("front").prev().addClass("front")):0===l?($(".back").removeClass("back").prev().addClass("back"),$(".slider li").removeClass("current").last().addClass("current"),$(".front").removeClass("front").prev().addClass("front")):($(".back").removeClass("back").prev().addClass("back"),$(".current").removeClass("current").prev().addClass("current"),$(".slider li").removeClass("front").last().addClass("front")),$(".slider").removeClass("swap")},300)})}e(),s(),r(),a()});

// Add scroll reveal functionality
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.bottom >= 0
    );
}

function handleScroll() {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        if (isElementInViewport(section)) {
            section.classList.add('visible');
        }
    });
}

// Add scroll event listener
window.addEventListener('scroll', handleScroll);
window.addEventListener('load', handleScroll);