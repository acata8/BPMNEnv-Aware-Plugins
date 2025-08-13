export default [
  {
    key: 'movement',
    typeValue: 'movement',
    defaultName: 'Move to destination',
    iconClass: 'movement-overlay',
    iconFile: require('../icons/movement.svg'),
    extraExt: (moddle) => [
      moddle.create('space:Destination', { value: '${destination}' })
    ]
  },
  {
    key: 'bind',
    typeValue: 'bind',
    defaultName: 'Bind',
    iconClass: 'binding-overlay',
    iconFile: require('../icons/binding.svg')
  },
  {
    key: 'unbind',
    typeValue: 'unbind',
    defaultName: 'Unbind',
    iconClass: 'unbinding-overlay',
    iconFile: require('../icons/unbinding.svg')
  }
];
