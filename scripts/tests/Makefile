#
# glslsandbox-player tests
#

O := output

GLSLSANDBOX_PLAYER := glslsandbox-player
GLSLSANDBOX_PLAYER_ARGS := -W320 -H180 -w0 -O2 -T1 -f3 -m -u -D
GLSLSANDBOX_PLAYER_TIMEOUT := 60

OUTPUT_DIR := $(shell mkdir -p $(O) && cd $(O) >/dev/null && pwd)
$(if $(OUTPUT_DIR),, $(error output directory "$(O)" does not exist))

AWK_PROG='1 == /^[0-9]+/ {print $$3;}'
SHADER_TEST_NAMES=$(shell $(GLSLSANDBOX_PLAYER) -l | awk $(AWK_PROG) )
SHADER_TESTS = $(addprefix $(OUTPUT_DIR)/,$(addsuffix .done,$(SHADER_TEST_NAMES)))

PPMS = $(wildcard $(OUTPUT_DIR)/*.ppm)
PNGS = $(PPMS:.ppm=.png)

all: $(SHADER_TESTS)

.NOTPARALLEL: $(SHADER_TESTS)

clean: clean-done clean-passed clean-failed clean-log

clean-done:
	cd $(OUTPUT_DIR) && rm -f $(addsuffix .done,$(SHADER_TEST_NAMES))

clean-passed:
	cd $(OUTPUT_DIR) && rm -f $(addsuffix .passed,$(SHADER_TEST_NAMES))

clean-failed:
	cd $(OUTPUT_DIR) && rm -f $(addsuffix .failed,$(SHADER_TEST_NAMES))

clean-log:
	cd $(OUTPUT_DIR) && rm -f $(addsuffix .log,$(SHADER_TEST_NAMES))

clean-failed-done:
	cd $(OUTPUT_DIR) && rm -f $(patsubst %.failed,%.done,$(wildcard $(OUTPUT_DIR)/*.failed))
	cd $(OUTPUT_DIR) && rm -f $(wildcard *.failed)

pngs: $(PNGS)
	rm -f $(PPMS)

%.png: %.ppm
	convert $< $@

shader = $(subst .done,,$(subst $(OUTPUT_DIR)/,,$(1)))

$(OUTPUT_DIR)/%.done:
	cd $(OUTPUT_DIR) && \
	timeout --foreground --kill-after=1 $(GLSLSANDBOX_PLAYER_TIMEOUT) \
          $(GLSLSANDBOX_PLAYER) -S $(call shader,$(@)) $(GLSLSANDBOX_PLAYER_ARGS) \
            > $(@:.done=.log) 2>&1 \
            && touch $(@:.done=.passed) \
            || echo "Failed with code $$?" > $(@:.done=.failed)
	touch $@
