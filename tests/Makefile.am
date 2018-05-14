# This was taken and adjusted from:
# https://www.gnu.org/software/autoconf/manual/autoconf.html#Making-testsuite-Scripts

# The `:;' works around a Bash 3.2 bug when the output is not writable.
$(srcdir)/package.m4: $(top_srcdir)/configure.ac
	:;{ \
	  echo '# Signature of the current package.' && \
	  echo 'm4_define([AT_PACKAGE_NAME],' && \
	  echo '  [$(PACKAGE_NAME)])' && \
	  echo 'm4_define([AT_PACKAGE_TARNAME],' && \
	  echo '  [$(PACKAGE_TARNAME)])' && \
	  echo 'm4_define([AT_PACKAGE_VERSION],' && \
	  echo '  [$(PACKAGE_VERSION)])' && \
	  echo 'm4_define([AT_PACKAGE_STRING],' && \
	  echo '  [$(PACKAGE_STRING)])' && \
	  echo 'm4_define([AT_PACKAGE_BUGREPORT],' && \
	  echo '  [$(PACKAGE_BUGREPORT)])'; \
	  echo 'm4_define([AT_PACKAGE_URL],' && \
	  echo '  [$(PACKAGE_URL)])'; \
	} >'$(srcdir)/package.m4'

EXTRA_DIST = testsuite.at $(srcdir)/package.m4 $(TESTSUITE) atlocal.in
TESTSUITE = $(srcdir)/testsuite

check-local: atconfig atlocal $(TESTSUITE)
	$(SHELL) '$(TESTSUITE)' $(TESTSUITEFLAGS)

installcheck-local: atconfig atlocal $(TESTSUITE)
	$(SHELL) '$(TESTSUITE)' AUTOTEST_PATH='$(bindir)' \
	  $(TESTSUITEFLAGS)

clean-local:
	test ! -f '$(TESTSUITE)' || \
	 $(SHELL) '$(TESTSUITE)' --clean

AUTOM4TE = $(SHELL) $(top_srcdir)/missing --run autom4te
AUTOTEST = $(AUTOM4TE) --language=autotest

TESTSUITE_SRCS = \
	$(srcdir)/tst-common-macros.at \
	$(srcdir)/tst-frame-pause.at \
	$(srcdir)/tst-frames-output.at \
	$(srcdir)/tst-gl-egl-control.at \
	$(srcdir)/tst-log-output.at \
	$(srcdir)/tst-misc-invocation.at \
	$(srcdir)/tst-mouse-emu.at \
	$(srcdir)/tst-render-backbuffer.at \
	$(srcdir)/tst-render-control.at \
	$(srcdir)/tst-render-fbo.at \
	$(srcdir)/tst-render-window.at \
	$(srcdir)/tst-shader-input-file.at \
	$(srcdir)/tst-shader-list.at \
	$(srcdir)/tst-shader-precision.at \
	$(srcdir)/tst-shader-select.at \
	$(srcdir)/tst-surface-position.at \
	$(srcdir)/tst-textures.at \
	$(srcdir)/tst-time-control.at \
	$(srcdir)/tst-warmup.at \
	$(srcdir)/testsuite.at

$(TESTSUITE):  $(TESTSUITE_SRCS) $(srcdir)/package.m4
	$(AUTOTEST) -I '$(srcdir)' -o $@.tmp $@.at
	mv $@.tmp $@

if ENABLE_INSTALL_TESTSUITE
testsuitedir = $(libexecdir)/$(PACKAGE_TARNAME)/tests
testsuite_SCRIPTS = $(TESTSUITE)

testdatadir = $(datadir)/$(PACKAGE_TARNAME)/testdata
testdata_DATA = \
	data/0.png \
	data/1.png \
	data/2.png \
	data/3.png \
	data/4.png \
	data/5.png \
	data/6.png \
	data/7.png \
	data/8.png \
	data/mix8.frag \
	\
	data/input-la.png \
	data/input-l.png \
	data/input-palette.png \
	data/input.png \
	data/input-rgba.png \
	data/tex0.frag \
	\
	data/6.0.frag \
	data/backbuff-texture-warning.frag \
	data/link-error.frag \
	data/syntax-error.frag \
	data/TestColor.frag

CLEANFILES = glslsandbox-player-testsuite

glslsandbox-player-testsuite: $(srcdir)/glslsandbox-player-testsuite.in
	sed \
		-e 's#@PACKAGE_TARNAME\@#$(PACKAGE_TARNAME)#' \
		-e 's#@testsuitedir\@#$(testsuitedir)#' \
		-e 's#@testdatadir\@#$(testdatadir)#' \
		$< > $@

bin_SCRIPTS = glslsandbox-player-testsuite

endif
