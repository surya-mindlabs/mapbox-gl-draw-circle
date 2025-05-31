import { jest } from '@jest/globals';
import createSupplementaryPoints from '@mapbox/mapbox-gl-draw/src/lib/create_supplementary_points.js';
import moveFeatures from '@mapbox/mapbox-gl-draw/src/lib/move_features.js';
import Constants from '@mapbox/mapbox-gl-draw/src/constants.js';
import distance from '@turf/distance';
import circle from '@turf/circle';
import createSupplementaryPointsForCircle from '../../lib/utils/create_supplementary_points_circle.js';
import DirectModeImport from '../../lib/modes/DirectModeOverride.js';

jest.mock('@mapbox/mapbox-gl-draw/src/lib/create_supplementary_points.js');
jest.mock('@mapbox/mapbox-gl-draw/src/lib/move_features.js');
jest.mock('@mapbox/mapbox-gl-draw/src/lib/constrain_feature_movement.js');
jest.mock('@turf/distance');
jest.mock('@turf/helpers');
jest.mock('@turf/circle');
jest.mock('../../lib/utils/create_supplementary_points_circle.js');

let DirectMode = DirectModeImport;

describe('DirectMode tests', () => {
  let mockState = {};
  let mockEvent = {};
  let mockDelta = {};
  let mockFeatures;

  beforeEach(() => {
    DirectMode = {
      ...DirectMode,
      getSelected: jest.fn(),
      fireActionable: jest.fn()
    };

    mockEvent = {
      lngLat: { lat: 0, lng: 0 }
    };

    mockDelta = {
      lat: 1,
      lng: 1
    };
    mockFeatures = [
      {
        properties: {
          isCircle: true,
          center: [0, 0]
        },
        geometry: {
          coordinates: []
        }
      }
    ];
    mockState = {
      featureId: 1,
      feature: {
        ...mockFeatures[0],
        incomingCoords: jest.fn()
      }
    }
    DirectMode.getSelected.mockReturnValue(mockFeatures);
  });

  afterEach(() => {
    createSupplementaryPoints.mockClear();
    createSupplementaryPointsForCircle.mockClear();
  });

  it('should move selected features when dragFeature is invoked', () => {
    DirectMode.dragFeature(mockState, mockEvent, mockDelta);
    expect(moveFeatures).toHaveBeenCalledWith(mockFeatures, mockDelta);
  });

  it('should update the center of the selected feature if its a circle', () => {
    DirectMode.dragFeature(mockState, mockEvent, mockDelta);
    expect(mockFeatures[0].properties.center).toEqual([1, 1]);
  });

  it('should set dragMoveLocation to the event lngLat', () => {
    DirectMode.dragFeature(mockState, mockEvent, mockDelta);
    expect(mockState.dragMoveLocation).toEqual(mockEvent.lngLat);
  });

  it('should update the radius when dragVertex is invoked and the feature is a circle', () => {
    distance.mockReturnValue(1);
    circle.mockReturnValue(mockFeatures[0]);
    DirectMode.dragVertex(mockState, mockEvent, mockDelta);
    expect(mockState.feature.incomingCoords).toHaveBeenCalledWith(mockFeatures[0].geometry.coordinates);
    expect(mockState.feature.properties.radiusInKm).toEqual(1);
  });

  it(`should display points generated using 
        createSupplementaryPointsForCircle when the feature is a circle`, () => {
      const mockDisplayFn = jest.fn();
      const mockGeoJSON = {
        properties: {
          id: 1,
          user_isCircle: true
        }
      };
      createSupplementaryPointsForCircle.mockReturnValue([]);
      DirectMode.toDisplayFeatures(mockState, mockGeoJSON, mockDisplayFn);
      expect(mockDisplayFn).toHaveBeenCalledWith(mockGeoJSON);
      expect(createSupplementaryPointsForCircle).toHaveBeenCalledWith(mockGeoJSON);
      expect(DirectMode.fireActionable).toHaveBeenCalled();
    });

    it(`should display points generated using createSupplementaryPoints
        when the feature is not a circle`, () => {
        createSupplementaryPoints.mockReturnValue([]);
        const mockDisplayFn = jest.fn();
        const mockGeoJSON = {
          properties: {
            id: 1,
            user_isCircle: false
          }
        };
        DirectMode.toDisplayFeatures(mockState, mockGeoJSON, mockDisplayFn);
        expect(mockDisplayFn).toHaveBeenCalledWith(mockGeoJSON);
        expect(createSupplementaryPoints).toHaveBeenCalledWith(mockGeoJSON, {
          map: undefined, midpoints: true, selectedPaths: undefined
        });
        expect(DirectMode.fireActionable).toHaveBeenCalled();
      });

    it('should not create supplementary vertices if the feature is not selected', () => {
        const mockDisplayFn = jest.fn();
        const mockGeoJSON = {
          properties: {
            id: 2,
            user_isCircle: false
          }
        };
        DirectMode.toDisplayFeatures(mockState, mockGeoJSON, mockDisplayFn);
        expect(mockDisplayFn).toHaveBeenCalledWith(mockGeoJSON);
        expect(DirectMode.fireActionable).toHaveBeenCalled();
        expect(createSupplementaryPoints).not.toHaveBeenCalled();
    });
});