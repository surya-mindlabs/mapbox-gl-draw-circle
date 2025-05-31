import { jest } from '@jest/globals';
import createSupplementaryPoints from '@mapbox/mapbox-gl-draw/src/lib/create_supplementary_points.js';
import moveFeatures from '@mapbox/mapbox-gl-draw/src/lib/move_features.js';
import Constants from '@mapbox/mapbox-gl-draw/src/constants.js';
import createSupplementaryPointsForCircle from '../../lib/utils/create_supplementary_points_circle.js';
import SimpleSelectModeImport from '../../lib/modes/SimpleSelectModeOverride.js';

jest.mock('@mapbox/mapbox-gl-draw/src/lib/create_supplementary_points.js');
jest.mock('@mapbox/mapbox-gl-draw/src/lib/move_features.js');
jest.mock('../../lib/utils/create_supplementary_points_circle.js');

let SimpleSelectMode = SimpleSelectModeImport;

describe('SimpleSelectMode tests', () => {
  let mockState = {};
  let mockEvent = {};
  let mockFeatures;

  beforeEach(() => {
    SimpleSelectMode = {
      ...SimpleSelectMode,
      getSelected: jest.fn(),
      isSelected: jest.fn(),
      fireActionable: jest.fn()
    };

    mockState = {
      dragMoving: false,
      dragMoveLocation: {
        lat: 1,
        lng: 1
      }
    };

    mockEvent = {
      originalEvent: {
        stopPropagation: jest.fn()
      },
      lngLat: {
        lng: 2,
        lat: 2
      }
    };

    mockFeatures = [
      {
        properties: {
          isCircle: true,
          center: [0, 0]
        }
      }
    ];

    SimpleSelectMode.getSelected.mockReturnValue(mockFeatures);
  });

  afterEach(() => {
    createSupplementaryPoints.mockClear();
    createSupplementaryPointsForCircle.mockClear();
    moveFeatures.mockClear();
  });

  it('should move selected features when dragMove is invoked', () => {
    SimpleSelectMode.dragMove(mockState, mockEvent);
    expect(mockState.dragMoving).toEqual(true);
    expect(mockEvent.originalEvent.stopPropagation).toHaveBeenCalled();
    expect(moveFeatures).toHaveBeenCalledWith(mockFeatures, { lng: 1, lat: 1 });
  });

  it('should update center of the circle feature when dragMove is invoked', () => {
    SimpleSelectMode.dragMove(mockState, mockEvent);
    expect(mockFeatures[0].properties.center).toEqual([1, 1]);
  });

  it('should display points generated using createSupplementaryPointsForCircle', () => {
    SimpleSelectMode.isSelected.mockReturnValue(true);
    createSupplementaryPointsForCircle.mockReturnValue([{}]);
    const mockGeoJSON = {
      geometry: {
        type: 'Polygon'
      },
      properties: {
        user_isCircle: true
      }
    };
    const mockDisplay = jest.fn();
    SimpleSelectMode.toDisplayFeatures(mockState, mockGeoJSON, mockDisplay);
    expect(SimpleSelectMode.fireActionable).toHaveBeenCalled();
    expect(mockDisplay.mock.calls).toEqual([
      [mockGeoJSON],
      [{}, 0, [ {} ]] // second and third elements are passed by Array.forEach
    ]);
  });

  it('should not generate supplementary vertices if the feature is not active', () => {
    SimpleSelectMode.isSelected.mockReturnValue(false)
    const mockGeoJSON = {
      geometry: {
        type: 'Polygon'
      },
      properties: {
        user_isCircle: true,
      }
    };
    const mockDisplay = jest.fn();
    SimpleSelectMode.toDisplayFeatures(mockState, mockGeoJSON, mockDisplay);
    expect(SimpleSelectMode.fireActionable).toHaveBeenCalled();
    expect(mockDisplay).toHaveBeenCalledWith(mockGeoJSON);
    expect(createSupplementaryPointsForCircle).not.toHaveBeenCalled();
  });

  it('should generate supplementary vertices using createSupplementaryVertices if the feature is not a circle', () => {
    SimpleSelectMode.isSelected.mockReturnValue(true);
    createSupplementaryPoints.mockReturnValue([{}]);
    const mockGeoJSON = {
      geometry: {
        type: 'Polygon'
      },
      properties: {
        user_isCircle: false,
      }
    };
    const mockDisplay = jest.fn();
    SimpleSelectMode.toDisplayFeatures(mockState, mockGeoJSON, mockDisplay);
    expect(SimpleSelectMode.fireActionable).toHaveBeenCalled();
    expect(createSupplementaryPoints).toHaveBeenCalledWith(mockGeoJSON);
    expect(mockDisplay.mock.calls).toEqual([
      [mockGeoJSON],
      [{}, 0, [ {} ]] // second and third elements are passed by Array.forEach
    ]);
  });
});