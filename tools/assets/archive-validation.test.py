"""Synthetic unsafe archives; never execute extracted content."""
import sys
sys.dont_write_bytecode = True
import importlib.util
import io
from pathlib import Path
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('guard', Path(__file__).with_name('check-blender-archive.py'))
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)

class ArchiveTests(unittest.TestCase):
    def check(self, extra, valid=False):
        with tempfile.TemporaryDirectory() as folder:
            archive = Path(folder) / 'fixture.tar.xz'
            with tarfile.open(archive, 'w:xz') as bundle:
                binary = tarfile.TarInfo(guard.ROOT + '/blender')
                binary.mode = 0o755
                binary.size = 4
                bundle.addfile(binary, io.BytesIO(b'test'))
                if extra:
                    for item in (extra if isinstance(extra, list) else [extra]):
                        bundle.addfile(item)
            if valid:
                guard.validate(archive)
            else:
                with self.assertRaises(ValueError):
                    guard.validate(archive)

    def test_regular_archive(self): self.check(None, True)
    def test_absolute(self): self.check(tarfile.TarInfo('/tmp/escape'))
    def test_parent(self): self.check(tarfile.TarInfo(guard.ROOT + '/../escape'))
    def test_wrong_root(self): self.check(tarfile.TarInfo('wrong/file'))
    def test_duplicate(self): self.check(tarfile.TarInfo(guard.ROOT + '/blender'))
    def test_device(self):
        item = tarfile.TarInfo(guard.ROOT + '/device'); item.type = tarfile.CHRTYPE; self.check(item)
    def test_privileged(self):
        item = tarfile.TarInfo(guard.ROOT + '/setuid'); item.mode = 0o4755; self.check(item)
    def test_symlink_escape(self):
        item = tarfile.TarInfo(guard.ROOT + '/link'); item.type = tarfile.SYMTYPE; item.linkname = '../../escape'; self.check(item)
    def test_symlink_child(self):
        link = tarfile.TarInfo(guard.ROOT + '/link'); link.type = tarfile.SYMTYPE; link.linkname = 'sibling'
        self.check([link, tarfile.TarInfo(guard.ROOT + '/link/child')])
    def test_safe_sibling_link(self):
        item = tarfile.TarInfo(guard.ROOT + '/link'); item.type = tarfile.SYMTYPE; item.linkname = 'blender'; self.check(item, True)
    def test_hardlink_escape(self):
        item = tarfile.TarInfo(guard.ROOT + '/link'); item.type = tarfile.LNKTYPE; item.linkname = '../escape'; self.check(item)

if __name__ == '__main__': unittest.main()
