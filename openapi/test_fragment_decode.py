import re

# Test fragment decoding
fragments = [
    '#/~1about~1hero',
    '#/~1tenant~1inventory~1items',
    '#/Conflict',
    '#/~1admin~1orders',
]

for frag in fragments:
    # Remove the # and initial /
    if frag.startswith('#/'):
        content = frag[2:]  # Remove #/
    else:
        content = frag[1:]  # Remove #
    
    # URL decode: ~1 -> /, ~0 -> ~
    decoded = content.replace('~1', '/').replace('~0', '~')
    
    print(f"{frag} -> {decoded}")
