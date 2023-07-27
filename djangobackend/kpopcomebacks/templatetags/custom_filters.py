from django import template
from django.template.defaultfilters import stringfilter

register = template.Library()


@register.filter(name="shorten")
@stringfilter
def shorten(value):
    return value.split("&")[0]

