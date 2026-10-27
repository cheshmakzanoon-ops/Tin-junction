#!/usr/bin/env python3
"""Reject unexpected Blender archive paths/types before extraction (no execution)."""
import posixpath
import sys
import tarfile

ROOT = 'blender-4.3.2-linux-x64'

def inside(name):
    return name == ROOT or name.startswith(ROOT + '/')

def validate(archive):
    seen = set()
    links = set()
    with tarfile.open(archive, 'r:xz') as bundle:
        for member in bundle:
            name = member.name.rstrip('/')
            if name in seen or name.startswith('/') or '\\' in name or not inside(name) or '..' in name.split('/') or '.' in name.split('/'):
                raise ValueError('unsafe or duplicate archive path: ' + member.name)
            seen.add(name)
            if not (member.isfile() or member.isdir() or member.issym() or member.islnk()):
                raise ValueError('unsupported archive entry: ' + name)
            if member.mode & 0o6000:
                raise ValueError('privileged archive entry: ' + name)
            if member.issym() or member.islnk():
                links.add(name)
                link = member.linkname
                if member.issym() and ('/' in link or link in ('.', '..', '')):
                    raise ValueError('only sibling file symlinks allowed: ' + name)
                if link.startswith('/') or '\\' in link:
                    raise ValueError('absolute or malformed archive link: ' + name)
                target = posixpath.normpath(posixpath.join(posixpath.dirname(name), link) if member.issym() else link)
                if not inside(target):
                    raise ValueError('escaping archive link: ' + name)
        for name in seen:
            ancestors = name.split('/')[:-1]
            if any('/'.join(ancestors[:i]) in links for i in range(1, len(ancestors) + 1)):
                raise ValueError('archive member nested beneath a link: ' + name)
        executable = bundle.getmember(ROOT + '/blender')
        if not executable.isfile() or not executable.mode & 0o111:
            raise ValueError('missing regular Blender executable')

if __name__ == '__main__':
    validate(sys.argv[1])
