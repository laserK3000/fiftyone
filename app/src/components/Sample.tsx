import React, { useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import styled from "styled-components";
import { animated, useSpring, useTransition } from "react-spring";

import Player51 from "./Player51";
import Tag from "./Tags/Tag";
import * as atoms from "../recoil/atoms";
import * as selectors from "../recoil/selectors";
import { labelFilters } from "./Filters/LabelFieldFilters.state";
import * as labelAtoms from "./Filters/utils";
import { packageMessage } from "../utils/socket";
import { useVideoData, useTheme } from "../utils/hooks";
import { Checkbox } from "@material-ui/core";

const SampleDiv = animated(styled.div`
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 10px ${({ theme }) => theme.backgroundDark};
  background-color: ${({ theme }) => theme.backgroundDark};
  width: 100%;
`);

const SampleChin = styled.div`
  display: grid;
  grid-template-columns: 1fr 43px;
  width: 100%;
  &::-webkit-scrollbar {
    width: 0px;
    background: transparent;
    display: none;
  }
  &::-webkit-scrollbar-thumb {
    width: 0px;
    display: none;
  }
  scrollbar-width: none;
  border: 1px ${({ theme }) => theme.backgroundDarkBorder} solid;
  border-top-width: 0;
`;

const SampleInfo = styled.div`
  height: 43px;
  display: block;
  padding: 14px 0 8px 0.5rem;
  bottom: 0;
  &::-webkit-scrollbar {
    width: 0px;
    background: transparent;
    display: none;
  }
  &::-webkit-scrollbar-thumb {
    width: 0px;
    display: none;
  }
  scrollbar-width: none;
  overflow-x: scroll;
  display: flex;
`;

const LoadingBar = animated(styled.div`
  position: absolute;
  bottom: 0;
  left: 0px;
  width: auto;
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.brandFullyTransparent} 0%,
    ${({ theme }) => theme.brand} 50%,
    ${({ theme }) => theme.brandFullyTransparent} 100%
  );
  height: 0.2em;
`);

const useHoverLoad = (socket, sample) => {
  if (sample._media_type !== "video") {
    return [[], () => {}, () => {}];
  }
  const [barItem, setBarItem] = useState([]);
  const [loaded, setLoaded] = useState(null);
  const viewCounter = useRecoilValue(atoms.viewCounter);

  const [requested, requestLabels] = useVideoData(
    socket,
    sample,
    (data, player) => {
      if (!data) return;
      const { labels } = data;
      setLoaded(viewCounter);
      setBarItem([]);
      player.updateOverlay(labels);
      if (player.isHovering()) player.play();
    }
  );

  const onMouseEnter = (event) => {
    event.preventDefault();
    const {
      data: { player },
    } = event;
    if (loaded === viewCounter) {
      barItem.length && setBarItem([]);
      player.play();
      return;
    }
    setBarItem([0]);
    requestLabels(player);
  };

  const onMouseLeave = () => setBarItem([]);

  const bar = useTransition(barItem, (item) => item, {
    from: { right: "100%" },
    enter: {
      right: "0%",
    },
    leave: {
      right: "-100%",
    },
    onRest: (item) => {
      setBarItem(barItem.length ? [item + 1] : []);
    },
  });

  return [bar, onMouseEnter, onMouseLeave];
};

const SelectedDiv = styled.div`
  border-left-width: 1px;
  border-color: ${({ theme }) => theme.backgroundDarkBorder};
  border-left-style: solid;
`;

const revealSample = () => {
  return useSpring({
    from: {
      opacity: 0,
    },
    opacity: 1,
  });
};

const Sample = ({ sample, metadata }) => {
  const http = useRecoilValue(selectors.http);
  const id = sample._id;
  const src = `${http}/filepath/${encodeURI(sample.filepath)}?id=${id}`;
  const socket = useRecoilValue(selectors.socket);
  const colorMap = useRecoilValue(selectors.colorMap);
  const colorByLabel = useRecoilValue(atoms.colorByLabel);
  const activeTags = useRecoilValue(labelAtoms.activeTags(false));
  const [stateDescription, setStateDescription] = useRecoilState(
    atoms.stateDescription
  );
  const theme = useTheme();

  const [selectedSamples, setSelectedSamples] = useRecoilState(
    atoms.selectedSamples
  );

  const handleClick = () => {
    const newSelected = new Set(selectedSamples);
    let event;
    if (newSelected.has(id)) {
      newSelected.delete(id);
      event = "remove_selection";
    } else {
      newSelected.add(id);
      event = "add_selection";
    }
    setSelectedSamples(newSelected);
    socket.send(packageMessage(event, { _id: id }));
    setStateDescription({ ...stateDescription, selected: [...newSelected] });
  };

  const [bar, onMouseEnter, onMouseLeave] = useHoverLoad(socket, sample);

  const bubbles = [
    ...[...sample.tags]
      .sort()
      .filter((t) => activeTags[t])
      .map((t) => {
        return <Tag key={t} name={t} color={colorMap[t]} title={t} />;
      }),
  ].filter((s) => s !== null);

  return (
    <SampleDiv className="sample" style={revealSample()}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "calc(100% - 44px)",
        }}
      >
        <Player51
          src={src}
          style={{
            height: "100%",
            width: "100%",
            position: "relative",
            cursor: "pointer",
          }}
          sample={sample}
          metadata={metadata}
          thumbnail={true}
          activeLabelsAtom={labelAtoms.activeFields(false)}
          colorByLabel={colorByLabel}
          filterSelector={labelFilters(false)}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={() => {}}
        />
        {bar.map(({ key, props }) => (
          <LoadingBar key={key} style={props} />
        ))}
      </div>
      <SampleChin>
        <SampleInfo>{bubbles}</SampleInfo>
        <SelectedDiv>
          <Checkbox
            checked={selectedSamples.has(id)}
            style={{ color: theme.brand }}
            onClick={() => handleClick()}
            title={"Click to select sample"}
          />
        </SelectedDiv>
      </SampleChin>
    </SampleDiv>
  );
};

export default React.memo(Sample);
